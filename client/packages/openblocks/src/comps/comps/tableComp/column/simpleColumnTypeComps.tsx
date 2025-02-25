import { withDefault } from "comps/generators";
import {
  BoolCodeControl,
  NumberControl,
  StringControl,
  StringOrNumberControl,
  stringUnionControl,
} from "comps/controls/codeControl";
import { Badge, Button } from "antd";
import { ActionSelectorControlInContext } from "comps/controls/actionSelector/actionSelectorControl";
import styled from "styled-components";
import { dropdownControl } from "comps/controls/dropdownControl";
import React from "react";
import { ColumnTypeCompBuilder } from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { TacoImage } from "openblocks-design";
import { trans } from "i18n";
import { disabledPropertyView, loadingPropertyView } from "comps/utils/propertyUtils";

export const ColumnValueTooltip = trans("table.columnValueTooltip");

export const ImageComp = (function () {
  const childrenMap = {
    src: withDefault(StringControl, "{{currentCell}}"),
    size: withDefault(NumberControl, "50"),
  };
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props) => {
      return <TacoImage style={{ pointerEvents: "auto" }} src={props.src} width={props.size} />;
    },
    (nodeValue) => nodeValue.src.value
  )
    .setPropertyViewFn((children) => {
      return (
        <>
          {children.src.propertyView({
            label: trans("table.imageSrc"),
            tooltip: ColumnValueTooltip,
          })}
          {children.size.propertyView({
            label: trans("table.imageSize"),
          })}
        </>
      );
    })
    .build();
})();

export const SimpleTextComp = (function () {
  const childrenMap = {
    text: StringOrNumberControl,
  };
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props) => {
      return props.text;
    },
    (nodeValue) => nodeValue.text.value
  )
    .setPropertyViewFn((children) => {
      return children.text.propertyView({
        label: trans("table.columnValue"),
        tooltip: ColumnValueTooltip,
      });
    })
    .build();
})();

export const LinkComp = (function () {
  const childrenMap = {
    text: StringControl,
    onClick: ActionSelectorControlInContext,
  };
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props) => {
      return <a onClick={props.onClick}>{props.text}</a>;
    },
    (nodeValue) => nodeValue.text.value
  )
    .setPropertyViewFn((children) => (
      <>
        {children.text.propertyView({
          label: trans("table.columnValue"),
          tooltip: ColumnValueTooltip,
        })}
        {children.onClick.propertyView({
          label: trans("table.action"),
          placement: "table",
        })}
      </>
    ))
    .build();
})();

const Button100 = styled(Button)`
  width: 100%;
`;

const ButtonTypeOptions = [
  {
    label: trans("table.primaryButton"),
    value: "primary",
  },
  {
    label: trans("table.defaultButton"),
    value: "default",
  },
] as const;

export const ButtonComp = (function () {
  const childrenMap = {
    text: StringControl,
    buttonType: dropdownControl(ButtonTypeOptions, "primary"),
    onClick: ActionSelectorControlInContext,
    loading: BoolCodeControl,
    disabled: BoolCodeControl,
  };
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props) => {
      return (
        <Button100
          type={props.buttonType}
          onClick={props.onClick}
          loading={props.loading}
          disabled={props.disabled}
        >
          {/* prevent the button from disappearing */}
          {!props.text ? " " : props.text}
        </Button100>
      );
    },
    (nodeValue) => nodeValue.text.value
  )
    .setPropertyViewFn((children) => (
      <>
        {children.text.propertyView({
          label: trans("table.columnValue"),
          tooltip: ColumnValueTooltip,
        })}
        {children.buttonType.propertyView({
          label: trans("table.type"),
          radioButton: true,
        })}
        {loadingPropertyView(children)}
        {disabledPropertyView(children)}
        {children.onClick.propertyView({
          label: trans("table.action"),
          placement: "table",
        })}
      </>
    ))
    .build();
})();

const BadgeStatusOptions = [
  "none",
  "success",
  "error",
  "default",
  "warning",
  "processing",
] as const;

export const BadgeStatusComp = (function () {
  const childrenMap = {
    text: StringControl,
    status: stringUnionControl(BadgeStatusOptions, "none"),
  };
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props) => {
      if (props.status === "none") {
        return props.text;
      }
      return <Badge status={props.status} text={props.text} />;
    },
    (nodeValue) => [nodeValue.status.value, nodeValue.text.value].filter((t) => t).join(" ")
  )
    .setPropertyViewFn((children) => {
      return (
        <>
          {children.text.propertyView({
            label: trans("table.columnValue"),
            tooltip: ColumnValueTooltip,
          })}
          {children.status.propertyView({
            label: trans("table.status"),
            tooltip: trans("table.statusTooltip"),
          })}
        </>
      );
    })
    .build();
})();
