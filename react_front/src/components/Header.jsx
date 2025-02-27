import React from "react";
import webcat from "../assets/webcat.png";
import "../CSS/Header.css";

const Header = () => {

    return (
        <header className="header" id="header">
            <div className="logoName">
                <div className="textHeader">
                <img src={webcat} alt="logoWebcat" className="logoHeader"/>
                <h1>Chat In Real Time</h1>
                <h3>Web SoKat</h3>
                </div>
            </div>
        </header>
    );
};

export default Header;