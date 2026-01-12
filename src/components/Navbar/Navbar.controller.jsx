import NavbarView from './Navbar.view.jsx';

export default function Navbar({ onLogoClick, onBackClick, rightContent }) {
  return (
    <NavbarView 
      onLogoClick={onLogoClick}
      onBackClick={onBackClick}
      rightContent={rightContent}
    />
  );
}
