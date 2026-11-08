import React from 'react';
import { Redirect } from 'expo-router';

/**
 * The old League page was folded into Standings (the Friends page). Old links
 * and notifications that still point here land there instead.
 */
export default function LeaderboardRedirect() {
  return <Redirect href="/friends" />;
}
