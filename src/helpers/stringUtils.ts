export namespace StringUtils {
  export const capitalize = (value: string): string => {
    if (stringIsNullOrWhiteSpace(value)) {
      return value;
    }
    return `${value[0].toUpperCase()}${value.substring(1)}`;
  };

  export const stringIsNullOrWhiteSpace = (value: string): boolean => {
    return !value || value.trim().length === 0;
  };
}
