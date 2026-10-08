import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { shortText } from '../text';

interface Props {
  text: string;
  style?: StyleProp<TextStyle>;
  maxSentences?: number;
  maxLength?: number;
  numberOfLines?: number;
}

const SIGNAL = /(\$?\d[\d,.]*(?:%|[KMBT])?)/gi;
const NUMBER = /^\$?\d/i;

/** Figures are bold and inherit their surrounding text color, including feedback. */
export function ColorText({ text, style, maxSentences = 2, maxLength = 170, numberOfLines }: Props) {
  const parts = shortText(text, maxSentences, maxLength).split(SIGNAL);
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, index) => {
        return NUMBER.test(part) ? <Text key={`${part}-${index}`} style={{ fontWeight: '800' }}>{part}</Text> : part;
      })}
    </Text>
  );
}
