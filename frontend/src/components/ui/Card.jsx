const Card = ({ children, className = '', onClick, hoverable = false, fullWidth = true }) => {
  return (
    <div
      className={`
        card-gradient-hover
        bg-white dark:bg-[#0a0a0a] rounded-lg shadow-md
        border border-gray-200 dark:border-white/10
        h-full flex flex-col
        ${fullWidth ? 'w-full' : ''}
        ${hoverable ? 'hover:scale-[1.02] cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-300 ease-in-out
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

Card.Header = ({ children, className = '' }) => (
  <div className={`flex-none px-6 py-4 border-b border-gray-200 dark:border-white/10 ${className}`}>
    {children}
  </div>
);

Card.Body = ({ children, className = '' }) => (
  <div className={`flex-1 overflow-auto px-6 py-4 ${className}`}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '' }) => (
  <div className={`flex-none px-6 py-4 border-t border-gray-200 dark:border-white/10 ${className}`}>
    {children}
  </div>
);

export default Card;
