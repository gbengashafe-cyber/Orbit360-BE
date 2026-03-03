import z from 'zod';
import { DeliveryMethod, RequestScope, TRAINING_TYPES, TrainingPriority } from './training-request.model';

export const TrainingRequestSchema = z
  .object({
    trainingType: z.enum(TRAINING_TYPES, `Unknown training type. Allowed training types are ${TRAINING_TYPES.join(', ')}.`),
    priority: z.enum(TrainingPriority, `Unknown training priority. Allowed priorities are ${TrainingPriority.join(',')} `),
    requestScope: z.enum(RequestScope, `Allowed request scopes are ${RequestScope.join(', ')}`),
    trainingTitle: z.string('Invalid training title').min(1, 'Training title is required'),
    trainingDescription: z.string('Invalid training description').min(1, 'Training description is required'),
    businessJustification: z.string('Invalid business justification'),
    skillsToGain: z.string('The skill to gain is required'),
    deliveryMethod: z.enum(DeliveryMethod, `Unknown training priority. Allowed priorities are ${DeliveryMethod.join(',')} `),
    preferredTimeframe: z.string('Preferred timeframe is required'),
    estimatedDuration: z.string('Invalid estimated time'),
    estimatedCost: z.coerce.number('Invalid estimated cost').positive('Invalid estimated cost'),
    trainingProvider: z.string('Invalid training provider'),
    numberOfTeamMembers: z.coerce.number('Invalid number of team members').optional(),
  })
  .refine(
    (val) => {
      return !(val.requestScope?.toUpperCase() === 'TEAM' && !val.numberOfTeamMembers);
    },
    {
      message: 'The number of team members must be specifies',
      path: ['numberOfTeamMembers'],
    },
  );
