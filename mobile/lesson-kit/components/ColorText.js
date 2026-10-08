import React from 'react';
import { Text } from 'react-native';
import { shortText } from '../text';
const SIGNAL = /(\$?\d[\d,.]*(?:%|[KMBT])?)/gi;
const NUMBER = /^\$?\d/i;
/** Figures are bold and inherit their surrounding text color, including feedback. */
export function ColorText({ text, style, maxSentences = 2, maxLength = 170, numberOfLines }) {
    const parts = shortText(text, maxSentences, maxLength).split(SIGNAL);
    return (<Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, index) => {
            return NUMBER.test(part) ? <Text key={`${part}-${index}`} style={{ fontWeight: '800' }}>{part}</Text> : part;
        })}
    </Text>);
}
