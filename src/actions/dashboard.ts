import { defineAction } from 'astro:actions';

import { requireAdmin } from '@/actions/_guard';
import { statsDashboard } from '@/lib/services/dashboard';

// KPIs + morosos + próximos cumples, todo derivado en servidor. Solo admin.
export const stats = defineAction({
  handler: async (_input, { locals }) => {
    requireAdmin(locals);
    return statsDashboard(new Date());
  },
});
