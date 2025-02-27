import React from "react";
import {Route, Routes} from 'react-router-dom';
import Home from '../pages/Home';
//TODO
import Commands from '../pages/Commands';


const Main = () => {
    return(
        <main>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/commands" element={<Commands />} />
            </Routes>
        </main>
    );
};
export default Main;