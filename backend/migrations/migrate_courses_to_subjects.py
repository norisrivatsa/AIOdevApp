#!/usr/bin/env python3
"""
Migration script to rename 'courses' collection to 'subjects' and update references.

This script:
1. Renames the 'courses' collection to 'subjects'
2. Updates all sessions with type='course' to type='subject'
3. Updates boards collection to remove old board configurations

The script is idempotent and safe to run multiple times.

IMPORTANT: Backup your database before running this migration!
"""

from pymongo import MongoClient
from datetime import datetime

MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "timetracker"


def migrate():
    """Perform the migration."""
    print("=" * 60)
    print("MIGRATION: Courses → Subjects")
    print("=" * 60)
    print(f"\nConnecting to MongoDB at {MONGODB_URL}...")

    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    try:
        # Test connection
        client.admin.command('ping')
        print(f"✓ Connected to database: {DATABASE_NAME}\n")

        # ========================================
        # Step 1: Check if migration is needed
        # ========================================
        collections = db.list_collection_names()
        has_courses = "courses" in collections
        has_subjects = "subjects" in collections

        print("Checking current state...")
        print(f"  - 'courses' collection exists: {has_courses}")
        print(f"  - 'subjects' collection exists: {has_subjects}")

        if not has_courses and has_subjects:
            print("\n✓ Migration already completed! 'subjects' collection exists.")
        elif has_courses and has_subjects:
            print("\n⚠ WARNING: Both 'courses' and 'subjects' collections exist!")
            print("  This might indicate a partial migration. Manual review recommended.")
            return

        # ========================================
        # Step 2: Rename courses collection
        # ========================================
        if has_courses and not has_subjects:
            courses_count = db.courses.count_documents({})
            print(f"\n📦 Renaming 'courses' collection ({courses_count} documents)...")

            if courses_count > 0:
                # MongoDB rename collection command
                db.courses.rename("subjects")
                print("✓ Collection renamed: courses → subjects")

                # Verify
                subjects_count = db.subjects.count_documents({})
                print(f"✓ Verified: {subjects_count} documents in 'subjects' collection")
            else:
                print("  No documents found in 'courses' collection.")
                db.courses.drop()
                print("✓ Empty 'courses' collection dropped")

        # ========================================
        # Step 3: Update session types
        # ========================================
        print("\n🔄 Updating sessions...")
        course_sessions_count = db.sessions.count_documents({"type": "course"})

        if course_sessions_count > 0:
            print(f"  Found {course_sessions_count} sessions with type='course'")
            result = db.sessions.update_many(
                {"type": "course"},
                {"$set": {"type": "subject"}}
            )
            print(f"✓ Updated {result.modified_count} sessions: type='course' → type='subject'")
        else:
            print("  No sessions with type='course' found")

        # ========================================
        # Step 4: Update boards
        # ========================================
        print("\n🎯 Checking boards...")

        # Check for old board names
        old_boards = list(db.boards.find({
            "name": {"$in": ["Courses", "Projects"]}
        }))

        if old_boards:
            print(f"  Found {len(old_boards)} old boards (Courses/Projects)")
            for board in old_boards:
                board_name = board.get("name")
                board_id = board.get("_id")
                print(f"  - Removing old board: {board_name} (id: {board_id})")
                db.boards.delete_one({"_id": board_id})
            print(f"✓ Removed {len(old_boards)} old boards")
        else:
            print("  No old boards found")

        # Check if new boards exist
        new_boards = list(db.boards.find({
            "name": {"$in": ["Analytics", "Creation"]}
        }))

        if not new_boards:
            print("\n  New boards (Analytics, Creation) will be created automatically")
            print("  when the backend starts up.")
        else:
            print(f"✓ New boards already exist: {[b['name'] for b in new_boards]}")

        # ========================================
        # Step 5: Summary
        # ========================================
        print("\n" + "=" * 60)
        print("MIGRATION SUMMARY")
        print("=" * 60)

        final_subjects = db.subjects.count_documents({})
        final_subject_sessions = db.sessions.count_documents({"type": "subject"})
        final_project_sessions = db.sessions.count_documents({"type": "project"})
        final_practice_sessions = db.sessions.count_documents({"type": "practice"})

        print(f"\n✓ Subjects: {final_subjects} documents")
        print(f"✓ Sessions (subject): {final_subject_sessions}")
        print(f"✓ Sessions (project): {final_project_sessions}")
        print(f"✓ Sessions (practice): {final_practice_sessions}")

        print("\n✅ Migration completed successfully!")
        print("\nNext steps:")
        print("  1. Restart the backend server (it will create new boards)")
        print("  2. Refresh the frontend")
        print("  3. Navigate to board 4 to see the Creation board")

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        client.close()
        print("\n✓ Database connection closed")


def main():
    """Main entry point."""
    print("\n⚠ IMPORTANT: Backup your database before proceeding!")
    print("\nThis migration will:")
    print("  1. Rename 'courses' collection to 'subjects'")
    print("  2. Update session types from 'course' to 'subject'")
    print("  3. Remove old board configurations")

    response = input("\nContinue with migration? (yes/no): ").strip().lower()

    if response != 'yes':
        print("\nMigration cancelled.")
        return

    # Run migration
    migrate()


if __name__ == "__main__":
    main()
