import NavbarView from './Navbar.view.jsx';

export default function Navbar({ onLogoClick, onBackClick, rightContent, hideSearch }) {
  return (
    <NavbarView 
      onLogoClick={onLogoClick}
      onBackClick={onBackClick}
      rightContent={rightContent}
      hideSearch={hideSearch}
    />
  );
}
