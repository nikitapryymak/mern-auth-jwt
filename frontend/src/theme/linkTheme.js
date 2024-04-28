import { baseTheme, defineStyleConfig } from "@chakra-ui/react";

const linkTheme = defineStyleConfig({
  baseStyle: {
    color: baseTheme.colors.blue[300],
  },
});

export default linkTheme;
