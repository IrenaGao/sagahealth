import ButtonView from './Button.view.jsx';

export default function Button({ onClick, children, className, disabled, ...props }) {
  return (
    <ButtonView
      onClick={onClick}
      className={className}
      disabled={disabled}
      {...props}
    >
      {children}
    </ButtonView>
  );
}
