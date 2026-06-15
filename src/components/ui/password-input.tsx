"use client";

import type { GroupProps, InputProps } from "@chakra-ui/react";
import {
  IconButton,
  Input,
  InputGroup,
  mergeRefs,
  useControllableState,
} from "@chakra-ui/react";
import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

export interface PasswordVisibilityProps {
  defaultVisible?: boolean;
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
}

export interface PasswordInputProps
  extends InputProps,
    PasswordVisibilityProps {
  rootProps?: GroupProps;
}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(function PasswordInput(props, ref) {
  const {
    rootProps,
    defaultVisible,
    visible: visibleProp,
    onVisibleChange,
    ...rest
  } = props;

  const [visible, setVisible] = useControllableState({
    value: visibleProp,
    defaultValue: defaultVisible || false,
    onChange: onVisibleChange,
  });

  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <InputGroup
      endElement={
        <IconButton
          tabIndex={-1}
          aria-label="Toggle password visibility"
          variant="ghost"
          size="sm"
          me="-2"
          aspectRatio="square"
          height="calc(100% - 8px)"
          disabled={rest.disabled}
          onPointerDown={(e) => {
            if (rest.disabled) return;
            if (e.button !== 0) return;
            e.preventDefault();
            setVisible(!visible);
          }}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </IconButton>
      }
      {...rootProps}
    >
      <Input
        {...rest}
        ref={mergeRefs(ref, inputRef)}
        type={visible ? "text" : "password"}
      />
    </InputGroup>
  );
});
