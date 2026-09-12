import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { tokens } from '../theme/tokens';
import { shortText } from '../text';

interface Props {
  text: string;
  style?: StyleProp<TextStyle>;
  maxSentences?: number;
  maxLength?: number;
  numberOfLines?: number;
}

const SIGNAL = /(\$?\d[\d,.]*(?:%|[KMBT])?|\b(?:growth|grow|growing|rise|rising|up|gain|gains|surge|expand|expanding|profit|profits|win|wins|correct|risk|risks|fall|falling|down|drop|decline|loss|losses|wrong)\b)/gi;
const UP = /^(growth|grow|growing|rise|rising|up|gain|gains|surge|expand|expanding|profit|profits|win|wins|correct)$/i;
const DOWN = /^(risk|risks|fall|falling|down|drop|decline|loss|losses|wrong)$/i;
const NUMBER = /^\$?\d/i;

/** Restrained inline color: figures and market signals stand out automatically. */
export function ColorText({ text, style, maxSentences = 2, maxLength = 170, numberOfLines }: Props) {
  const parts = shortText(text, maxSentences, maxLength).split(SIGNAL);
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, index) => {
        const color = NUMBER.test(part)
          ? tokens.color.signalData
          : UP.test(part)
            ? tokens.color.signalUp
            : DOWN.test(part)
              ? tokens.color.signalDown
              : undefined;
        return color ? <Text key={`${part}-${index}`} style={{ color, fontWeight: '900' }}>{part}</Text> : part;
      })}
    </Text>
  );
}
