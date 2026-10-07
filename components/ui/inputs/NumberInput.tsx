import { Colors, Styles } from "@/constants/design-system";
import { Input, InputProps } from "tamagui";

export const NumberInput = ({ onChangeText, ...props }: InputProps) => {
  return (
    <Input
      borderWidth={1}
      marginVertical={4}
      borderColor={Colors.details}
      paddingHorizontal={24}
      paddingVertical={8}
      backgroundColor={"transparent"}
      width={"100%"}
      style={Styles.bodyM}
      placeholderTextColor={Colors.details}
      color={Colors.details}
      keyboardType="numeric"
      inputMode="numeric"
      focusStyle={{
        borderColor: Colors.details,
        backgroundColor: "transparent",
      }}
      onChangeText={(text) => {
        const sanitized = text.replace(/[^0-9]/g, "");
        onChangeText?.(sanitized);
      }}
      {...props}
    />
  );
};
