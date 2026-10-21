

function NavBar({onAddAccountClick, onCategoriesClick, onRulesClick}) {
  

  return (
    <div className="nav-bar">
        <h1>Monthly</h1>
        <div className="nav-buttons">
        <span className="nav-bar-items" onClick={onCategoriesClick}>Categories</span>
        <span className="nav-bar-items" onClick={onAddAccountClick}>Add Account</span>
        <span className="nav-bar-items" onClick={onRulesClick}>Rules</span>
        <div className="profile-picture"><span>LC</span></div>
        </div>
        </div>

  );
}

export default NavBar;