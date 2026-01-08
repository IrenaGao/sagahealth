export default function ButtonView({ onClick, children, className, disabled, ...props }) {
  return (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
