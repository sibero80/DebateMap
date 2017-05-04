import {GetData, GetDataAsync} from "../../Frame/Database/DatabaseHelpers";
import {Term} from "./terms/@Term";
import {IsNaN} from "../../Frame/General/Types";
import {CachedTransform} from "../../Frame/V/VCache";
import TermComponent from "./termComponents/@TermComponent";

export function GetTermComponent(id: number) {
	if (id == null || IsNaN(id)) return null;
	return GetData(`termComponents/${id}`) as TermComponent;
}
export async function GetTermComponentAsync(id: number) {
	return await GetDataAsync(`termComponents/${id}`) as TermComponent;
}

export function GetTermComponents(term: Term) {
	let components = (term.components || {}).VKeys(true).map(id=>GetTermComponent(parseInt(id)));
	return CachedTransform("GetTermComponents", {termID: term._id}, components, ()=>components);
}
export async function GetNodeChildrenAsync(term: Term) {
	return await Promise.all(term.components.VKeys(true).map(id=>GetDataAsync(`termComponents/${id}`))) as TermComponent[];
}