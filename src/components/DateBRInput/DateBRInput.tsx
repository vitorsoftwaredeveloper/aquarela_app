"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { Input } from "../Input/Input";
import { maskDataBr } from "@/utils/dataBr";

interface DateBRInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

/** Campo de data em texto mascarado dd/mm/aaaa — evita o formato do input nativo depender do locale do navegador/SO. */
export const DateBRInput = forwardRef<HTMLInputElement, DateBRInputProps>(
  function DateBRInput({ onChange, placeholder, maxLength, ...rest }, ref) {
    return (
      <Input
        type="text"
        inputMode="numeric"
        placeholder={placeholder ?? "dd/mm/aaaa"}
        maxLength={maxLength ?? 10}
        ref={ref}
        onChange={(e) => {
          e.target.value = maskDataBr(e.target.value);
          onChange?.(e);
        }}
        {...rest}
      />
    );
  },
);
