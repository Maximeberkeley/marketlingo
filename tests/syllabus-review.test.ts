import { describe, expect, it } from 'vitest';
import { syllabusFor, syllabusDay as serverDay, FACET_ARC as serverArc } from '../supabase/functions/_shared/syllabus';
import { syllabusDay as phoneDay, dayPromise } from '../mobile/lib/syllabus';
import { CURRICULUM_STRUCTURES } from '../supabase/functions/_shared/curriculum-structures';

describe('180-day additive review syllabus', () => {
  it('preserves six ordered angles for all 30 topics in every market', () => {
    for (const market of Object.keys(CURRICULUM_STRUCTURES)) {
      const plan = syllabusFor(market);
      expect(plan).toHaveLength(180);
      for (let start = 0; start < 180; start += 6) {
        const topicDays = plan.slice(start, start + 6);
        expect(topicDays.map(day => day.facetKey)).toEqual(serverArc.map(facet => facet.key));
        expect(new Set(topicDays.map(day => day.topic)).size).toBe(1);
        expect(topicDays[0].facetLabel).toBe('What it is');
      }
      expect(plan[179].facetLabel).toBe('Where it breaks');
      expect(plan.filter(day => day.isConsolidation)).toHaveLength(25);
    }
  });

  it('keeps server and phone mapping aligned and reviews additive on all 180 days', () => {
    for (const market of Object.keys(CURRICULUM_STRUCTURES)) {
      for (let day = 1; day <= 180; day += 1) {
        const server = serverDay(market, day);
        const phone = phoneDay(market, day);
        expect(phone.day).toBe(server.day);
        expect(phone.season).toBe(server.month);
        expect(phone.block).toBe(Math.floor(((day - 1) % 30) / 6) + 1);
        expect(phone.facet.key).toBe(server.facetKey);
        expect(phone.isConsolidation).toBe(server.isConsolidation);
        const facet = serverArc.find(facet => facet.key === server.facetKey);
        if (!facet) throw new Error('Unknown facet');
        expect(server.angle).toContain(facet.angle);
        expect(dayPromise(market, day)).toContain(phone.facet.label);
        if (day % 7 === 0) {
          expect(server.angle).toContain('review must not replace');
          expect(dayPromise(market, day)).toContain('Weekly review');
        }
      }
    }
  });

  it('keeps day 7 as the next topic definition, then money on day 8', () => {
    expect(serverDay('aerospace', 7).facetKey).toBe('definition');
    expect(dayPromise('aerospace', 7)).toBe('What it is · Weekly review');
    expect(serverDay('aerospace', 8).facetKey).toBe('money');
    expect(serverDay('aerospace', 181).day).toBe(180);
    expect(phoneDay('aerospace', 0).day).toBe(1);
  });
});