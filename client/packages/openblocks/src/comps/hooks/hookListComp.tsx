import { withDefault } from "comps/generators";
import { list } from "comps/generators/list";
import { NameAndExposingInfo } from "comps/utils/exposingTypes";
import {
  CompTree,
  findParentContainer,
  getAllCompItems,
  getCompTree,
} from "comps/comps/containerBase/utils";
import { HookComp } from "./hookComp";

const HookListTmpComp = list(HookComp);
const HookListTmp2Comp = class extends HookListTmpComp {
  getAllCompItems() {
    return getAllCompItems(this.getCompTree());
  }

  private getCompTree(): CompTree {
    const compMap = Object.values(this.children).reduce<Record<string, HookComp>>((res, cur) => {
      res[cur.children.name.getView()] = cur;
      return res;
    }, {});
    return getCompTree(compMap);
  }

  // Find the container the component belongs to
  findContainer(key: string) {
    for (const childComp of Object.values(this.children)) {
      const childResult = (childComp.children.comp as any)?.findContainer?.(key) ?? undefined;
      if (childResult) {
        return childResult;
      }
    }
    return undefined;
  }

  findParentContainer(compName: string, containerCompType?: string) {
    return findParentContainer(undefined, this.getCompTree(), compName, containerCompType);
  }

  nameAndExposingInfo(): NameAndExposingInfo {
    const result: NameAndExposingInfo = {};
    const allCompMap = this.getAllCompItems();
    Object.values(allCompMap).forEach((item) => {
      const name = item.children.name.getView();
      if (name.length > 0) {
        result[name] = item.exposingInfo();
      }
    });
    return result;
  }
};

const HookListTmp3Comp = withDefault(HookListTmp2Comp, [
  // { compType: "title", name: "title" },
  // { compType: "windowSize", name: "windowSize" },
  { compType: "urlParams", name: "url" },
  { compType: "momentJsLib", name: "moment" },
  { compType: "lodashJsLib", name: "_" },
  { compType: "utils", name: "utils" },
  { compType: "message", name: "message" },
  { compType: "localStorage", name: "localStorage" },
  { compType: "currentUser", name: "currentUser" },
]);
export const HookListComp = HookListTmp3Comp;
