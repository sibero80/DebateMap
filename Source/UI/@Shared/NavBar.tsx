import {styles, colors} from "../../Frame/UI/GlobalStyles";
import {Dispatch} from "redux";
import {Component} from "react";
import GoogleButton from "react-google-button";
import {connect} from "react-redux";
import {firebaseConnect, helpers} from "react-redux-firebase";
import {BaseComponent, BaseProps, BaseComponentWithConnector} from "react-vextensions";
import {Debugger} from "../../Frame/General/Others";
import {E} from "js-vextensions";
import {Button} from "react-vcomponents";
import {TextInput} from "react-vcomponents";
import Action from "../../Frame/General/Action";
import {HandleError} from "../../Frame/General/Errors";
import UserPanel from "./NavBar/UserPanel";
import {Connect} from "../../Frame/Database/FirebaseConnect";
import {ACTTopRightOpenPanelSet, ACTTopLeftOpenPanelSet, ACTSetPage, ACTSetSubpage} from "../../Store/main";
import ChatPanel from "./NavBar/ChatPanel";
import StreamPanel from "./NavBar/StreamPanel";
import SearchPanel from "./NavBar/SearchPanel";
import {SubNavBarButton} from "./SubNavBar";
import Radium from "radium";
import {Link} from "../../Frame/ReactComponents/Link";
import {NotificationsUI} from "./NavBar/NotificationsUI";
import {Column} from "react-vcomponents";
import {Row} from "react-vcomponents";
import ReputationPanel from "./NavBar/ReputationPanel";
import GuidePanel from "./NavBar/GuidePanel";
import {VURL, DeepGet} from "js-vextensions";
import {Div} from "react-vcomponents";
import { GetData } from "Frame/Database/DatabaseHelpers";
import {ShowMessageBox} from "react-vmessagebox";
import {ResetCurrentDBRoot} from "UI/More/Admin/ResetCurrentDBRoot";
import {ACTPersonalMapSelect} from "../../Store/main/personal";
import {ACTDebateMapSelect} from "Store/main/debates";

// main
// ==========

const originSettings = {horizontal: "right", vertical: "top"};
const buttonStyle = {color: "white", textDecoration: "none"};
const avatarSize = 50;

const avatarStyles = {
	icon: {width: avatarSize, height: avatarSize},
	button: {marginRight: "1.5rem", width: avatarSize, height: avatarSize},
	wrapper: {marginTop: 45 - avatarSize}
};

let connector = (state, {}: {})=> ({
	topLeftOpenPanel: State(a=>a.main.topLeftOpenPanel),
	topRightOpenPanel: State(a=>a.main.topRightOpenPanel),
	auth: State(a=>a.firebase.auth),
	_: GetData({useUndefinedForInProgress: true}, "maps"),
	dbNeedsInit: GetData({useUndefinedForInProgress: true}, "maps") === null,
});
@Connect(connector)
export class NavBar extends BaseComponentWithConnector(connector, {}) {
	render() {
		let {topLeftOpenPanel, topRightOpenPanel, auth, dbNeedsInit} = this.props;
		return (
			<nav style={{
				position: "relative", zIndex: 11, padding: "0 10px", boxShadow: colors.navBarBoxShadow,
				//background: "#000 url('/Images/Tiling/TopMenu.png') repeat-x scroll",
				background: "rgba(0,0,0,1)",
			}}>
				<div style={{display: "flex"}}>
					<span style={{position: "absolute", left: 0}}>
						{/*<NavBarPanelButton text="Stream" panel="stream" corner="top-left"/>
						<NavBarPanelButton text="Chat" panel="chat" corner="top-left"/>
						<NavBarPanelButton text={
							<Div className="cursorSet" style={{position: "relative", height: 45}}>
								<Div style={{color: "rgba(255,255,255,1)", justifyContent: "center"}}>Rep: n/a</Div>
								{/*<Div style={{color: "rgba(255,255,255,1)", justifyContent: "center"}}>Rep: 100</Div>
								<Div style={{position: "absolute", bottom: 3, width: "100%", textAlign: "center",
									fontSize: 11, lineHeight: "11px", color: "rgba(0,255,0,.7)"}}>+100</Div>*#/}
							</Div> as any
						} panel="reputation" corner="top-left"/>*/}
					</span>
					<div style={{position: "absolute", zIndex: 11, left: 0, top: 45,
							boxShadow: colors.navBarBoxShadow, clipPath: "inset(0 -150px -150px 0)", display: "table"}}>
						{topLeftOpenPanel == "stream" && <StreamPanel/>}
						{topLeftOpenPanel == "chat" && <ChatPanel/>}
						{topLeftOpenPanel == "reputation" && <ReputationPanel/>}
					</div>
					<Div ct style={{position: "fixed", left: 0, width: "30%", top: 45, bottom: 0}}>
						{dbNeedsInit && startURL.GetQueryVar("init") &&
							<Row>
								<Button text="Initialize database" onClick={()=> {
									let boxController = ShowMessageBox({
										title: `Initialize database?`, cancelButton: true,
										message: `Initialize database content under db-root ${dbVersion}?`,
										onOK: ()=> {
											ResetCurrentDBRoot();
										}
									});
								}}/>
							</Row>}
						<NotificationsUI/>
					</Div>
					
					<span style={{margin: "0 auto", paddingRight: 6}}>
						<NavBarButton page="database" text="Database"/>
						<NavBarButton page="feedback" text="Feedback"/>
						<NavBarButton page="forum" text="Forum"/>
						<NavBarButton page="more" text="More"/>
						<NavBarButton page="home" text="Debate Map" style={{margin: "0 auto", textAlign: "center", fontSize: 23}}/>
						<NavBarButton page="social" text="Social"/>
						<NavBarButton page="personal" text="Personal"/>
						<NavBarButton page="debates" text="Debates"/>
						<NavBarButton page="global" text="Global"/>
					</span>

					<span style={{position: "absolute", right: 0, display: "flex"}}>
						{/*<NavBarPanelButton text="Search" panel="search" corner="top-right"/>
						<NavBarPanelButton text="Guide" panel="guide" corner="top-right"/>*/}
						<NavBarPanelButton text={DeepGet(auth, "displayName") ? auth.displayName.match(/(.+?)( |$)/)[1] : `Sign in`} panel="profile" corner="top-right"/>
					</span>
					<div style={{position: "absolute", zIndex: 11, right: 0, top: 45,
							boxShadow: colors.navBarBoxShadow, clipPath: "inset(0 0 -150px -150px)", display: "table"}}>
						{topRightOpenPanel == "search" && <SearchPanel/>}
						{topRightOpenPanel == "guide" && <GuidePanel/>}
						{topRightOpenPanel == "profile" && <UserPanel/>}
					</div>
				</div>
			</nav>
		);
	}
}

//@Radium
@Connect(state=> ({
	currentPage: State(a=>a.main.page),
}))
export class NavBarButton extends BaseComponent
		<{page?: string, text: string, panel?: boolean, active?: boolean, style?, onClick?: (e)=>void} & Partial<{currentPage: string}>,
		{hovered: boolean}> {
	render() {
		var {page, text, panel, active, style, onClick, currentPage} = this.props;
		//let {_radiumStyleState: {main: radiumState = {}} = {}} = this.state as any;
		//let {_radiumStyleState} = this.state as any;
		let {hovered} = this.state;
		active = active != null ? active : page == currentPage;

		let finalStyle = E(
			{
				position: "relative", display: "inline-block", cursor: "pointer", verticalAlign: "middle",
				lineHeight: "45px", color: "#FFF", padding: "0 15px", fontSize: 12, textDecoration: "none", opacity: .9,
			},
			style,
		);

		let actions = [] as Action<any>[];
		if (page) {
			if (page != currentPage) {
				actions = [new ACTSetPage(page)];
			} else {
				if (page == "personal") {
					actions = [new ACTPersonalMapSelect({id: null})];
				} else if (page == "debates") {
					actions = [new ACTDebateMapSelect({id: null})];
				} else {
					actions = [new ACTSetSubpage({page, subpage: null})];
				}
			}
		}
		
		let hoverOrActive = hovered || active;
		return (
			<Link actions={d=>d(...actions)} style={finalStyle} onMouseEnter={()=>this.SetState({hovered: true})} onMouseLeave={()=>this.SetState({hovered: false})} onClick={onClick}>
				{text}
				{hoverOrActive &&
					<div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: 2, background: `rgba(100,255,100,1)`}}/>}
			</Link>
		);
	}
}

type NavBarPanelButton_Props = {text: string, panel: string, corner: "top-left" | "top-right"} & Partial<{topLeftOpenPanel, topRightOpenPanel}>;
@Connect(_=> ({
	topLeftOpenPanel: State(a=>a.main.topLeftOpenPanel),
	topRightOpenPanel: State(a=>a.main.topRightOpenPanel),
}))
export class NavBarPanelButton extends BaseComponent<NavBarPanelButton_Props, {}> {
	render() {
		let {text, panel, corner, topLeftOpenPanel, topRightOpenPanel} = this.props;
		let active = (corner == "top-left" ? topLeftOpenPanel : topRightOpenPanel) == panel;
		return (
			<NavBarButton page={panel} text={text} panel={true} active={active} onClick={e=> {
				e.preventDefault();
				if (corner == "top-left")
					store.dispatch(new ACTTopLeftOpenPanelSet(active ? null : panel));
				else
					store.dispatch(new ACTTopRightOpenPanelSet(active ? null : panel));
			}}/>
		);
	}
}