import React, {useEffect, useState} from "react"
import stock1 from "../assets/images/stock1.png"
import stock2 from "../assets/images/stock2.png"
import stock3 from "../assets/images/stock3.png"
import stock4 from "../assets/images/stock4.png"
import stock5 from "../assets/images/stock5.png"
import stock6 from "../assets/images/stock6.png"
import stock7 from "../assets/images/stock7.png"
import stock8 from "../assets/images/stock8.png"
import "../styles/recentplays.less"

const images = [stock8, stock7, stock6, stock5, stock4, stock3, stock2, stock1]

const RecentPlays: React.FunctionComponent = (props) => {
    const generateJSX = () => {
        let row1 = []
        let row2 = []
        for (let i = 0; i < 4; i++) {
            row1.push(<img className="recent-img" src={images[i]}/>)
        }
        for (let i = 4; i < 8; i++) {
            row2.push(<img className="recent-img" src={images[i]}/>)
        }
        return (
            <div className="recent-row-container">
                <div className="recent-row">{row1}</div>
                <div className="recent-row">{row2}</div>
            </div>
        )
    }

    return (
        <section className="recent-plays">
            <div className="recent-title-container">
                <p className="recent-title">Recent Plays</p>
            </div>
            {generateJSX()}
        </section>
    )
}

export default RecentPlays