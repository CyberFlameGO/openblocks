import { useContext, useMemo } from "react";
import { EditorContext } from "../../editorState";
import { BottomTabs } from "pages/editor/bottom/BottomTabs";
import { useSelector } from "react-redux";
import { getDataSource, getDataSourceTypes } from "redux/selectors/datasourceSelectors";
import { InputStatus } from "antd/es/_util/statusUtils";
import {
  changeValueAction,
  deferAction,
  executeQueryAction,
  wrapActionExtraInfo,
} from "openblocks-core";
import {
  CustomModal,
  QueryConfigItemWrapper,
  QueryConfigLabel,
  QueryConfigWrapper,
  QueryPropertyViewWrapper,
  QuerySectionWrapper,
  TriggerTypeStyled,
} from "openblocks-design";
import { ResourceDropdown } from "../resourceDropdown";
import { onlyManualTrigger } from "../queryCompUtils";
import { QueryComp } from "../queryComp";
import { includes, mapValues } from "lodash";
import { MysqlConfig } from "../../../api/datasourceApi";
import { BottomResTypeEnum } from "types/bottomRes";
import { PageType } from "../../../constants/pageConstants";
import { trans } from "i18n";
import { manualTriggerResource } from "@openblocks-ee/constants/queryConstants";

export function QueryPropertyView(props: { comp: InstanceType<typeof QueryComp> }) {
  const { comp } = props;

  const editorState = useContext(EditorContext);
  const datasource = useSelector(getDataSource);
  const datasourceTypes = useSelector(getDataSourceTypes);

  const children = comp.children;
  const dispatch = comp.dispatch;
  const datasourceId = children.datasourceId.getView();
  const datasourceType = children.compType.getView();
  const datasourceConfig = datasource.find((d) => d.datasource.id === datasourceId)?.datasource
    .datasourceConfig;

  const datasourceStatus: InputStatus = useMemo(() => {
    if (datasourceType === "js" || datasourceType === "libraryQuery") {
      return "";
    }
    if (
      datasource.find((info) => info.datasource.id === datasourceId) &&
      datasourceTypes.find((type) => type.id === datasourceType)
    ) {
      return "";
    }
    return "error";
  }, [datasource, datasourceTypes, datasourceId, datasourceType]);

  return (
    <BottomTabs
      type={BottomResTypeEnum.Query}
      tabsConfig={
        [
          {
            key: "general",
            title: trans("query.generalTab"),
            children: <QueryGeneralPropertyView comp={comp} datasourceStatus={datasourceStatus} />,
          },
          {
            key: "notification",
            title: trans("query.notificationTab"),
            children: children.notification.propertyView(children.triggerType.getView()),
          },
          {
            key: "advanced",
            title: trans("query.advancedTab"),
            children: (
              <QueryPropertyViewWrapper>
                {datasourceType === "mysql" &&
                  datasourceConfig &&
                  (datasourceConfig as MysqlConfig).enableTurnOffPreparedStatement && (
                    <QuerySectionWrapper>
                      <QueryConfigWrapper style={{ alignItems: "center" }}>
                        <QueryConfigLabel>SQL</QueryConfigLabel>
                        <QueryConfigItemWrapper>
                          {(children.comp.children as any).disablePreparedStatement.propertyView({
                            label: trans("query.disablePreparedStatement"),
                            type: "checkbox",
                            tooltip: trans("query.disablePreparedStatementTooltip"),
                          })}
                        </QueryConfigItemWrapper>
                      </QueryConfigWrapper>
                    </QuerySectionWrapper>
                  )}

                {children.triggerType.getView() === "manual" && (
                  <QuerySectionWrapper>
                    {children.confirmationModal.getPropertyView()}
                  </QuerySectionWrapper>
                )}

                <QuerySectionWrapper>
                  {children.timeout.propertyView({
                    label: trans("query.timeout"),
                    placeholder: "10s",
                    tooltip: trans("query.timeoutTooltip", { maxSeconds: 120, defaultSeconds: 10 }),
                    placement: "bottom",
                  })}
                </QuerySectionWrapper>

                <QuerySectionWrapper>
                  {children.triggerType.getView() === "automatic" && (
                    <>
                      {children.periodic.propertyView({
                        label: trans("query.periodic"),
                        type: "checkbox",
                        placement: "bottom",
                      })}
                      {children.periodic.getView() &&
                        children.periodicTime.propertyView({
                          placement: "bottom",
                          label: trans("query.periodicTime"),
                          placeholder: "5s",
                          tooltip: trans("query.periodicTimeTooltip", { defaultSeconds: 5 }),
                        })}
                    </>
                  )}
                </QuerySectionWrapper>
              </QueryPropertyViewWrapper>
            ),
          },
        ] as const
      }
      tabTitle={children.name.getView()}
      onRunBtnClick={() =>
        dispatch(
          executeQueryAction({
            afterExecFunc: () => editorState.setShowResultCompName(children.name.getView()),
          })
        )
      }
      btnLoading={children.isFetching.getView()}
      status={datasourceStatus}
      message={datasourceStatus === "error" ? trans("query.dataSourceStatusError") : undefined}
    />
  );
}

export const QueryGeneralPropertyView = (props: {
  comp: InstanceType<typeof QueryComp>;
  datasourceStatus?: InputStatus;
  placement?: PageType;
}) => {
  const { datasourceStatus = "", comp, placement = "editor" } = props;
  const editorState = useContext(EditorContext);

  const children = comp.children;
  const dispatch = comp.dispatch;
  const datasourceId = children.datasourceId.getView();
  const datasourceType = children.compType.getView();

  return (
    <QueryPropertyViewWrapper>
      <QuerySectionWrapper>
        <QueryConfigWrapper style={{ alignItems: "center" }}>
          <QueryConfigLabel>{trans("query.chooseDataSource")}</QueryConfigLabel>
          <QueryConfigItemWrapper direction={"row"}>
            <ResourceDropdown
              selectedResource={{ id: datasourceId, type: datasourceType }}
              changeResource={(newDatasourceId: string, newDatasourceType: string) => {
                // brute-force modify json
                dispatch(
                  wrapActionExtraInfo(
                    changeValueAction({
                      ...comp.toJsonValue(),
                      triggerType:
                        newDatasourceType === children.compType.getView()
                          ? children.triggerType.getView() // Switching data sources of the same type retains the original trigger type
                          : includes(manualTriggerResource, newDatasourceType)
                          ? "manual"
                          : "automatic",
                      lastQueryStartTime: children.lastQueryStartTime.getView(),
                      datasourceId: newDatasourceId,
                      compType: newDatasourceType,
                      comp:
                        newDatasourceType === children.compType.getView()
                          ? children.comp.toJsonValue() // The data source type remains unchanged, and the query information is retained
                          : {},
                    }),
                    [
                      {
                        type: "modify",
                        compName: children.name.getView(),
                        compType: newDatasourceType,
                      },
                    ]
                  )
                );

                if (datasourceStatus === "error") {
                  const queries = editorState
                    .getQueriesComp()
                    .getView()
                    .filter(
                      (q) =>
                        q.children.datasourceId.getView() === datasourceId &&
                        q.children.id.getView() !== children.id.getView()
                    );
                  queries.length > 0 &&
                    CustomModal.confirm({
                      title: trans("query.updateExceptionDataSourceTitle"),
                      content: trans("query.updateExceptionDataSourceContent", {
                        query: queries.map((q) => q.children.name.getView()).join("、"),
                      }),
                      bodyStyle: { marginTop: "20px" },
                      onConfirm: () => {
                        queries.forEach((q) => {
                          q.dispatch(
                            deferAction(
                              wrapActionExtraInfo(
                                changeValueAction({
                                  ...mapValues(q.children, (c) => c.toJsonValue()),
                                  datasourceId: newDatasourceId,
                                  compType: newDatasourceType,
                                }),
                                [
                                  {
                                    type: "modify",
                                    compName: q.children.name.getView(),
                                    compType: newDatasourceType,
                                  },
                                ]
                              )
                            )
                          );
                        });
                      },
                      confirmBtnType: "primary",
                      okText: trans("query.update"),
                    });
                }
              }}
              status={datasourceStatus}
            />
            {children.compType.getView() === "mysql" && (
              <div style={{ width: "104px", marginLeft: "8px", flexShrink: 0 }}>
                {children.comp.children.mode.propertyView({})}
              </div>
            )}
          </QueryConfigItemWrapper>
        </QueryConfigWrapper>

        {placement === "editor" && (
          <TriggerTypeStyled>
            {children.triggerType.propertyView({
              label: trans("query.triggerType"),
              placement: "bottom",
              disabled: onlyManualTrigger(children.compType.getView()),
            })}
          </TriggerTypeStyled>
        )}
      </QuerySectionWrapper>

      <QuerySectionWrapper>
        {"propertyView" in children.comp
          ? children.comp.propertyView({
              datasourceId: datasourceId,
            })
          : children.comp.getPropertyView()}
      </QuerySectionWrapper>

      {placement === "editor" && (
        <QuerySectionWrapper>
          <QueryConfigWrapper>
            <QueryConfigLabel>{trans("eventHandler.eventHandlers")}</QueryConfigLabel>
            {children.onEvent.getPropertyView()}
          </QueryConfigWrapper>
        </QuerySectionWrapper>
      )}
    </QueryPropertyViewWrapper>
  );
};
