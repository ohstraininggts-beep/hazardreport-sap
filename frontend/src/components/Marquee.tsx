import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, View, Text, StyleProp, ViewStyle } from "react-native";
import { fonts } from "@/src/theme";

// Continuous horizontal ticker (running text) like the Zite safety marquee.
export function Marquee({
  text,
  color = "#FFFFFF",
  background = "transparent",
  speed = 60, // px per second
  fontSize = 12.5,
  style,
}: {
  text: string;
  color?: string;
  background?: string;
  speed?: number;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    if (textWidth <= 0) return;
    translateX.setValue(0);
    const duration = (textWidth / speed) * 1000;
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: -textWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [textWidth, speed, translateX]);

  const content = `${text}     •     `;

  return (
    <View style={[{ overflow: "hidden", backgroundColor: background }, style]}>
      <Animated.View style={{ flexDirection: "row", transform: [{ translateX }] }}>
        <Text
          onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
          numberOfLines={1}
          style={{ color, fontFamily: fonts.medium, fontSize }}
        >
          {content}
        </Text>
        {/* duplicate for seamless loop */}
        <Text numberOfLines={1} style={{ color, fontFamily: fonts.medium, fontSize }}>
          {content}
        </Text>
        <Text numberOfLines={1} style={{ color, fontFamily: fonts.medium, fontSize }}>
          {content}
        </Text>
      </Animated.View>
    </View>
  );
}
