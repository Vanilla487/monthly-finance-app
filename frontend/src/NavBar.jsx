

function NavBar({onAddAccountClick, onCategoriesClick}) {
  

  return (
    <div className="nav-bar">
        <h1>Monthly</h1>
        <div className="nav-buttons">
        <button className="btn-secondary" onClick={onCategoriesClick}>Categories</button>
        <button className="btn-secondary" onClick={onAddAccountClick}>+ Add account</button>
        </div>
        </div>

  );
}

export default NavBar;