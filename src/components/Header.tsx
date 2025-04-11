import { FC } from "react";

const Header: FC = () => {
  return (
    <header className="App-Header">
      <b>NotePad</b> - <span>Unsecured app</span> - <span>All data is public</span> - <span>No support provided</span> ☠️
    </header>
  );
};

export default Header;
