import {Image} from "../../../../Store/firebase/images/@Image";
import {GetImage} from "../../../../Store/firebase/images";
import {connect} from "react-redux";
import {BaseComponent, AddGlobalStyle, GetInnerComp, FindDOM, BaseComponentWithConnector} from "react-vextensions";
import {Pre, Div, TextArea_AutoSize} from "react-vcomponents";
import {MapNodeUI_LeftBox} from "./NodeUI_LeftBox";
import {VMenu} from "react-vmenu";
import {ShowMessageBox} from "react-vmessagebox";
import {styles} from "../../../../Frame/UI/GlobalStyles";
import {TextInput} from "react-vcomponents";
import {DN, GetPercentFromXToY, Lerp} from "js-vextensions";
import {Button} from "react-vcomponents";
import {CachedTransform} from "js-vextensions";
import {WaitXThenRun} from "js-vextensions";
import keycode from "keycode";
import {NodeUI_Menu} from "./NodeUI_Menu";
import {RatingsRoot} from "../../../../Store/firebase/nodeRatings/@RatingsRoot";
import {MapNodeView} from "../../../../Store/main/mapViews/@MapViews";
import {ImageAttachment, MapNode, MapNodeL2, ClaimForm, MapNodeL3} from "../../../../Store/firebase/nodes/@MapNode";
import {GetNodeRatingsRoot, GetRatings, GetRatingAverage, GetRatingValue, ShouldRatingTypeBeReversed, RatingFilter, GetRatingAverage_AtPath} from "../../../../Store/firebase/nodeRatings";
import {GetUserID} from "../../../../Store/firebase/users";
import {MapNodeType_Info, MapNodeType, GetNodeColor} from "../../../../Store/firebase/nodes/@MapNodeType";
import {RootState} from "../../../../Store/index";
import {RatingType_Info, RatingType, ratingTypes} from "../../../../Store/firebase/nodeRatings/@RatingType";
import {Map} from "../../../../Store/firebase/maps/@Map";
import {ACTMapNodeSelect, ACTMapNodeExpandedSet, ACTMapNodePanelOpen, ACTMapNodeTermOpen} from "../../../../Store/main/mapViews/$mapView/rootNodeViews";
import {Connect} from "../../../../Frame/Database/FirebaseConnect";
import {Column} from "react-vcomponents";
import DefinitionsPanel from "./NodeUI/Panels/DefinitionsPanel";
import QuestionsPanel from "./NodeUI/Panels/QuestionsPanel";
import TagsPanel from "./NodeUI/Panels/TagsPanel";
import DetailsPanel from "./NodeUI/Panels/DetailsPanel";
import {OthersPanel} from "./NodeUI/Panels/OthersPanel";
import SocialPanel from "./NodeUI/Panels/SocialPanel";
import RatingsPanel from "./NodeUI/Panels/RatingsPanel";
import DiscussionPanel from "./NodeUI/Panels/DiscussionPanel";
import {Row} from "react-vcomponents";
import VReactMarkdown from "../../../../Frame/ReactComponents/VReactMarkdown";
import {GetFontSizeForNode, GetPaddingForNode, GetNodeDisplayText, GetRatingTypesForNode, GetNodeForm, GetNodeL3, IsPremiseOfSinglePremiseArgument, GetMainRatingType} from "../../../../Store/firebase/nodes/$node";
import {ContentNode} from "../../../../Store/firebase/contentNodes/@ContentNode";
import {VURL} from "js-vextensions";
import InfoButton from "../../../../Frame/ReactComponents/InfoButton";
import {GetTerm, GetTermVariantNumber} from "../../../../Store/firebase/terms";
import {Term} from "../../../../Store/firebase/terms/@Term";
import {ParseSegmentsForPatterns} from "../../../../Frame/General/RegexHelpers";
import {GetParentNode, IsNodeSubnode, GetNodeChildrenL3, GetParentNodeL3} from "../../../../Store/firebase/nodes";
import classNames from "classnames";
import { GetEquationStepNumber } from "../../../../Store/firebase/nodes/$node/equation";
import NodeMathUI from "UI/@Shared/Maps/MapNode/NodeMathUI";
import {SourceType, SourceChain, Source} from "Store/firebase/contentNodes/@SourceChain";
import {TermPlaceholder} from "./NodeUI_Inner/TermPlaceholder";
import {SlicePath, WaitTillPathDataIsReceiving, WaitTillPathDataIsReceived, DBPath, RemoveHelpers} from "../../../../Frame/Database/DatabaseHelpers";
import SubPanel from "./NodeUI_Inner/SubPanel";
import VReactMarkdown_Remarkable from "../../../../Frame/ReactComponents/VReactMarkdown_Remarkable";
import {HistoryPanel} from "./NodeUI/Panels/HistoryPanel";
import {GetPathsToNodesChangedSinceX, ChangeType, GetNodeChangeType, GetChangeTypeOutlineColor} from "../../../../Store/firebase/mapNodeEditTimes";
import { GetTimeFromWhichToShowChangedNodes } from "Store/main/maps/$map";
import { ACTSetLastAcknowledgementTime } from "Store/main";
import {GetLastAcknowledgementTime, WeightingType} from "../../../../Store/main";
import AddNodeRevision from "../../../../Server/Commands/AddNodeRevision";
import { IsDoubleClick } from "Frame/General/Others";
import {SetNodeUILocked} from "UI/@Shared/Maps/MapNode/NodeUI";
import {IsUserCreatorOrMod} from "Store/firebase/userExtras";
import {MapNodeRevision_titlePattern} from "../../../../Store/firebase/nodes/@MapNodeRevision";
import { RS_CalculateTruthScore, RS_GetAllValues, ReasonScoreValues_RSPrefix, RS_CalculateTruthScoreComposite } from "Store/firebase/nodeRatings/ReasonScore";
import {RS_CalculateWeightMultiplier, RS_CalculateBaseWeight, RS_CalculateWeight} from "../../../../Store/firebase/nodeRatings/ReasonScore";
import {ExpandableBox} from "./ExpandableBox";

//export type NodeHoverExtras = {panel?: string, term?: number};

type Props = {
	map: Map, node: MapNodeL3, nodeView: MapNodeView, path: string, width: number, widthOverride?: number,
	panelPosition?: "left" | "below", useLocalPanelState?: boolean, style?,
};
let connector = (state, {map, node, path}: Props)=> {
	let sinceTime = GetTimeFromWhichToShowChangedNodes(map._id);
	/*let pathsToChangedNodes = GetPathsToNodesChangedSinceX(map._id, sinceTime);
	let ownNodeChanged = pathsToChangedNodes.Any(a=>a.split("/").Any(b=>b == node._id));
	let changeType = ownNodeChanged ? GetNodeChangeType(node, sinceTime) : null;*/

	let lastAcknowledgementTime = GetLastAcknowledgementTime(node._id);
	sinceTime = sinceTime.KeepAtLeast(lastAcknowledgementTime);

	let changeType =
		node.createdAt > sinceTime ? ChangeType.Add :
		node.current.createdAt > sinceTime ? ChangeType.Edit :
		null;

	let parent = GetNodeL3(SlicePath(path, 1));
	let combineWithParentArgument = IsPremiseOfSinglePremiseArgument(node, parent);
	//let ratingReversed = ShouldRatingTypeBeReversed(node);

	let mainRatingType = GetMainRatingType(node);
	let ratingNode = node;
	//let ratingNodePath = path;
	if (combineWithParentArgument) {
		mainRatingType = "impact";
		ratingNode = parent;
		//ratingNodePath = SlicePath(path, 1);
	}
	let mainRating_average = GetRatingAverage_AtPath(ratingNode, mainRatingType);
	//let mainRating_mine = GetRatingValue(ratingNode._id, mainRatingType, GetUserID());
	let mainRating_mine = GetRatingAverage_AtPath(ratingNode, mainRatingType, new RatingFilter({includeUser: GetUserID()}));

	let showReasonScoreValuesForThisNode = State(a=>a.main.weighting) == WeightingType.ReasonScore && (node.type == MapNodeType.Argument || node.type == MapNodeType.Claim);
	if (showReasonScoreValuesForThisNode) {
		var reasonScoreValues = RS_GetAllValues(node, path, true) as ReasonScoreValues_RSPrefix;
	}

	return {
		form: GetNodeForm(node, path),
		ratingsRoot: GetNodeRatingsRoot(node._id),
		mainRating_average,
		mainRating_mine,
		reasonScoreValues,
		showReasonScoreValues: State(a=>a.main.showReasonScoreValues),
		changeType,
	};
};
@Connect(connector)
export class NodeUI_Inner extends BaseComponentWithConnector(connector,
		{hovered: false, hoverPanel: null as string, hoverTermID: null as number, /*local_selected: boolean,*/ local_openPanel: null as string}) {
	static defaultProps = {panelPosition: "left"};
	titlePanel: TitlePanel;
	render() {
		let {map, node, nodeView, path, width, widthOverride,
			panelPosition, useLocalPanelState, style, form,
			ratingsRoot, mainRating_average, mainRating_mine, reasonScoreValues,
			changeType, showReasonScoreValues} = this.props;
		let {hovered, hoverPanel, hoverTermID, /*local_selected,*/ local_openPanel} = this.state;
		let nodeTypeInfo = MapNodeType_Info.for[node.type];
		let backgroundColor = GetNodeColor(node);

		let parent = GetParentNodeL3(path);
		let combinedWithParentArgument = IsPremiseOfSinglePremiseArgument(node, parent);
		if (combinedWithParentArgument) {
			backgroundColor = GetNodeColor(parent);
		}
	
		let outlineColor = GetChangeTypeOutlineColor(changeType);
		let barSize = 5;
		let pathNodeIDs = path.split(`/`).Select(a=>parseInt(a));
		let isSubnode = IsNodeSubnode(node);

		let backgroundFillPercent = mainRating_average || 0;
		let markerPercent = mainRating_mine;
		let showReasonScoreValuesForThisNode = State(a=>a.main.weighting) == WeightingType.ReasonScore && (node.type == MapNodeType.Argument || node.type == MapNodeType.Claim);
		if (showReasonScoreValuesForThisNode) {
			var {rs_argTruthScoreComposite, rs_argWeightMultiplier, rs_argWeight, rs_claimTruthScore, rs_claimBaseWeight} = reasonScoreValues;
			if (node.type == MapNodeType.Claim) {
				backgroundFillPercent = rs_claimTruthScore * 100;
				markerPercent = null;
			} else if (node.type == MapNodeType.Argument) {
				//backgroundFillPercent = Lerp(0, 100, GetPercentFromXToY(0, 2, rs_argWeightMultiplier));
				//backgroundFillPercent = Lerp(0, 100, GetPercentFromXToY(0, 2, rs_argWeight));
				backgroundFillPercent = rs_argTruthScoreComposite * 100;
				markerPercent = null;
			}
		}

		let nodeReversed = form == ClaimForm.Negation;
		
		let leftPanelShow = (nodeView && nodeView.selected) || hovered; //|| local_selected;
		let panelToShow = hoverPanel || local_openPanel || (nodeView && nodeView.openPanel);
		let subPanelShow = node.type == MapNodeType.Claim && (node.current.contentNode || node.current.image);
		let bottomPanelShow = leftPanelShow && panelToShow;
		let expanded = nodeView && nodeView.expanded;
		
		return (
			<ExpandableBox {...{width, widthOverride, outlineColor, expanded}} parent={this}
				className={classNames("NodeUI_Inner", {root: pathNodeIDs.length == 0})}
				padding={GetPaddingForNode(node, isSubnode)}
				style={E({
					display: "flex", position: "relative", borderRadius: 5, cursor: "default",
					width, minWidth: widthOverride,
					boxShadow: "rgba(0,0,0,1) 0px 0px 2px" + (outlineColor ? `, rgba(${outlineColor},1) 0px 0px 1px` : "").repeat(6),
				}, style)}
				onClick={e=> {
					if ((e.nativeEvent as any).ignore) return;
					/*if (useLocalPanelState) {
						this.SetState({local_selected: true});
						return;
					}*/

					if (nodeView == null || !nodeView.selected) {
						store.dispatch(new ACTMapNodeSelect({mapID: map._id, path}));
					}
					store.dispatch(new ACTSetLastAcknowledgementTime({nodeID: node._id, time: Date.now()}));
				}}
				beforeChildren={
					[
						leftPanelShow &&
							<MapNodeUI_LeftBox {...{map, path, node, nodeView, ratingsRoot, panelPosition, local_openPanel, backgroundColor}} asHover={hovered}
									onPanelButtonHover={panel=>this.SetState({hoverPanel: panel})}
									onPanelButtonClick={panel=> {
										if (useLocalPanelState) {
											this.SetState({local_openPanel: panel, hoverPanel: null});
											return;
										}
		
										if (nodeView.openPanel != panel) {
											store.dispatch(new ACTMapNodePanelOpen({mapID: map._id, path, panel}));
										} else {
											store.dispatch(new ACTMapNodePanelOpen({mapID: map._id, path, panel: null}));
											this.SetState({hoverPanel: null});
										}
									}}>
								{/* fixes click-gap */}
								{panelPosition == "below" && <div style={{position: "absolute", right: -1, width: 1, top: 0, bottom: 0}}/>}
							</MapNodeUI_LeftBox>,
						// fixes click-gap
						leftPanelShow && panelPosition == "left" && <div style={{position: "absolute", right: "100%", width: 1, top: 0, bottom: 0}}/>,
					]
				}
				onTextHolderClick={e=>IsDoubleClick(e) && this.titlePanel && GetInnerComp(this.titlePanel).OnDoubleClick()}
				text={
					[
						<TitlePanel ref={c=>this.titlePanel = c} {...{parent: this, map, node, nodeView, path}}/>,
						subPanelShow && <SubPanel node={node}/>,
						<NodeUI_Menu {...{map, node, path}}/>
					]
				}
				{...{backgroundFillPercent, backgroundColor, markerPercent}}
				toggleExpanded={e=> {
					store.dispatch(new ACTMapNodeExpandedSet({mapID: map._id, path, expanded: !expanded, recursive: expanded && e.altKey}));
					e.nativeEvent.ignore = true; // for some reason, "return false" isn't working
					//return false;
				}}
				afterChildren={[
					bottomPanelShow &&
						<div style={{
							position: "absolute", left: panelPosition == "below" ? 130 + 1 : 0, top: "calc(100% + 1px)",
							width: width, minWidth: (widthOverride|0).KeepAtLeast(550), zIndex: hovered ? 6 : 5,
							padding: 5, background: backgroundColor.css(), borderRadius: 5, boxShadow: "rgba(0,0,0,1) 0px 0px 2px",
						}}>
							{ratingTypes.Contains(panelToShow) && (()=> {
								if (["impact", "relevance"].Contains(panelToShow) && node.type == MapNodeType.Claim) {
									let argumentNode = parent;
									let argumentPath = SlicePath(path, 1);
									let ratings = GetRatings(argumentNode._id, panelToShow as RatingType);
									return <RatingsPanel node={argumentNode} path={argumentPath} ratingType={panelToShow as RatingType} ratings={ratings}/>;
								}
								let ratings = GetRatings(node._id, panelToShow as RatingType);
								return <RatingsPanel node={node} path={path} ratingType={panelToShow as RatingType} ratings={ratings}/>;
							})()}
							{panelToShow == "definitions" &&
								<DefinitionsPanel ref={c=>this.definitionsPanel = c} {...{node, path, hoverTermID}}
									openTermID={nodeView.openTermID}
									onHoverTerm={termID=>this.SetState({hoverTermID: termID})}
									onClickTerm={termID=>store.dispatch(new ACTMapNodeTermOpen({mapID: map._id, path, termID: termID}))}/>}
							{panelToShow == "discussion" && <DiscussionPanel/>}
							{panelToShow == "social" && <SocialPanel/>}
							{panelToShow == "tags" && <TagsPanel/>}
							{panelToShow == "details" && <DetailsPanel map={map} node={node} path={path}/>}
							{panelToShow == "history" && <HistoryPanel map={map} node={node} path={path}/>}
							{panelToShow == "others" && <OthersPanel map={map} node={node} path={path}/>}
						</div>,
					(()=> {
						if (!showReasonScoreValuesForThisNode) return;
						
						//if (node.type == MapNodeType.Claim) {
						let mainScore = node.type == MapNodeType.Argument ? RS_CalculateTruthScoreComposite(node) : RS_CalculateTruthScore(node);
	
						return (
							<div className="clickThrough" style={{position: "absolute", top: "100%", width: "100%", zIndex: 1, textAlign: "center", fontSize: 14}}>
								{node.type == MapNodeType.Argument && `Truth score: ${ToPercentStr(mainScore)}${
									` Weight: [...]x${rs_argWeightMultiplier.RoundTo_Str(.01)} = ${rs_argWeight.RoundTo_Str(.01)}`
								}`}
								{node.type == MapNodeType.Claim && `Truth score: ${ToPercentStr(mainScore)}${
									combinedWithParentArgument
										? ` Weight: ${rs_claimBaseWeight.RoundTo_Str(.01)}x${rs_argWeightMultiplier.RoundTo_Str(.01)} = ${rs_argWeight.RoundTo_Str(.01)}`
										: ""
								}`}
							</div>
						);
						//}
					})(),
				]}
			/>
		);
	}
	definitionsPanel: DefinitionsPanel;
	ComponentDidMount() {
		// we have to use native/jquery hover/mouseenter+mouseleave, to fix that in-equation term-placeholders would cause "mouseleave" to be triggered
		let dom = $(FindDOM(this));
		//dom.off("mouseenter mouseleave");
		$(dom).hover(()=> {
			if ($(".scrolling").length == 0) {
				this.SetState({hovered: true});
			}
		}, ()=> {
			this.SetState({hovered: false})
		});
	}
}

type TitlePanelProps = {parent: NodeUI_Inner, map: Map, node: MapNodeL2, nodeView: MapNodeView, path: string} & Partial<{equationNumber: number}>;
@Connect((state, {node, path}: TitlePanelProps)=> ({
	$1: node.current.image && GetImage(node.current.image.id),
	equationNumber: node.current.equation ? GetEquationStepNumber(path) : null,
}))
class TitlePanel extends BaseComponent<TitlePanelProps, {editing: boolean, newTitle: string, applyingEdit: boolean}> {
	OnDoubleClick() {
		let {node} = this.props;
		let creatorOrMod = IsUserCreatorOrMod(GetUserID(), node);
		if (creatorOrMod && node.current.equation == null) {
			this.SetState({editing: true});
		}
	}
	render() {
		let {map, node, nodeView, path, equationNumber} = this.props;
		let latex = node.current.equation && node.current.equation.latex;
		let isSubnode = IsNodeSubnode(node);
		let {editing, newTitle, applyingEdit} = this.state;
		newTitle = newTitle != null ? newTitle : GetNodeDisplayText(node, path);

		let noteText = (node.current.equation && node.current.equation.explanation) || node.current.note;

		return (
			//<Row style={{position: "relative"}}>
			<div style={{position: "relative"}} onClick={e=>IsDoubleClick(e) && this.OnDoubleClick()}>
				{equationNumber != null &&
					<Pre>{equationNumber}) </Pre>}
				{!editing &&
					<span style={E(
						{position: "relative", fontSize: GetFontSizeForNode(node, isSubnode), whiteSpace: "initial"},
						isSubnode && {margin: "4px 0 1px 0"},
					)}>
						{latex && <NodeMathUI text={node.current.equation.text} onTermHover={this.OnTermHover} onTermClick={this.OnTermClick}/>}
						{!latex && this.RenderNodeDisplayText(GetNodeDisplayText(node, path))}
					</span>}
				{editing &&
					<Row style={E(
						{position: "relative", fontSize: GetFontSizeForNode(node, isSubnode), whiteSpace: "initial", alignItems: "stretch"},
						isSubnode && {margin: "4px 0 1px 0"},
					)}>
						{!applyingEdit &&
							<TextArea_AutoSize required={true} pattern={MapNodeRevision_titlePattern} allowLineBreaks={false} style={{flex: 1}}
								ref={a=>a && a.DOM.focus()}
								onKeyDown={e=> {
									if (e.keyCode == keycode.codes.esc) {
										this.SetState({editing: false});
									} else if (e.keyCode == keycode.codes.enter) {
										this.ApplyEdit();
									}
								}}
								value={newTitle} onChange={val=>this.SetState({newTitle: val})}/>}
						{!applyingEdit &&
							<Button enabled={newTitle.match(MapNodeRevision_titlePattern) != null} text="✔️" p="0 3px" style={{borderRadius: "0 5px 5px 0"}}
								onClick={()=>this.ApplyEdit()}/>}
						{applyingEdit && <Row>Applying edit...</Row>}
					</Row>}
				{noteText &&
					<Pre style={{
						fontSize: 11, color: "rgba(255,255,255,.5)",
						//marginLeft: "auto",
						marginLeft: 15, marginTop: 3, float: "right",
					}}>
						{noteText}
					</Pre>}
				{node.type == MapNodeType.Claim && node.current.contentNode &&
					<InfoButton text="Allowed exceptions are: bold and [...] (collapsed segments)"/>}
			</div>
		);
	}

	async ApplyEdit() {
		let {map, node, nodeView, path, equationNumber} = this.props;
		let {editing, newTitle, applyingEdit} = this.state;

		this.SetState({applyingEdit: true});

		let parentNode = GetParentNode(path);
		
		let form = GetNodeForm(node, path);
		let titleKey = {[ClaimForm.Negation]: "negation", [ClaimForm.YesNoQuestion]: "yesNoQuestion"}[form] || "base";
		let newRevision = Clone(node.current);
		if (newRevision.titles[titleKey] != newTitle) {
			newRevision.titles[titleKey] = newTitle;

			SetNodeUILocked(parentNode._id, true);
			var revisionID = await new AddNodeRevision({mapID: map._id, revision: RemoveHelpers(newRevision)}).Run();
			store.dispatch(new ACTSetLastAcknowledgementTime({nodeID: node._id, time: Date.now()}));
			await WaitTillPathDataIsReceiving(DBPath(`nodeRevisions/${revisionID}`));
			await WaitTillPathDataIsReceived(DBPath(`nodeRevisions/${revisionID}`));
			SetNodeUILocked(parentNode._id, false);
		}
		this.SetState({applyingEdit: false, editing: false});
	}

	OnTermHover(termID: number, hovered: boolean) {
		let {parent} = this.props;
		parent.SetState({hoverPanel: hovered ? "definitions" : null, hoverTermID: hovered ? termID : null});
	}
	OnTermClick(termID: number) {
		let {parent, map, path} = this.props;
		//parent.SetState({hoverPanel: "definitions", hoverTermID: termID});
		store.dispatch(new ACTMapNodePanelOpen({mapID: map._id, path, panel: "definitions"}));
		store.dispatch(new ACTMapNodeTermOpen({mapID: map._id, path, termID: termID}));
	}

	RenderNodeDisplayText(text: string) {
		let {parent, map, path} = this.props;

		//let segments = ParseSegmentsFromNodeDisplayText(text);
		let segments = ParseSegmentsForPatterns(text, [
			{name: "term", regex: /{(.+?)\}\[(.+?)\]/}
		]);

		let elements = [];
		for (let [index, segment] of segments.entries()) {
			if (segment.patternMatched == null) {
				let segmentText = segment.textParts[0];
				let edgeWhiteSpaceMatch = segmentText.match(/^( *).+?( *)$/);
				if (edgeWhiteSpaceMatch[1]) elements.push(<span>{edgeWhiteSpaceMatch[1]}</span>);
				elements.push(
					<VReactMarkdown_Remarkable key={index} containerType="span" source={segmentText}
						rendererOptions={{
							components: {
								p: props=><span>{props.children}</span>
							},
						}}/>
				);
				if (edgeWhiteSpaceMatch[2]) elements.push(<span>{edgeWhiteSpaceMatch[2]}</span>);
			} else if (segment.patternMatched == "term") {
				let refText = segment.textParts[1];
				let termID = segment.textParts[2].ToInt();
				elements.push(
					<TermPlaceholder key={index} refText={refText} termID={termID} onHover={hovered=>this.OnTermHover(termID, hovered)} onClick={()=>this.OnTermClick(termID)}/>
				);
			} else {
				Assert(false);
			}
		}
		return elements;
	}
}