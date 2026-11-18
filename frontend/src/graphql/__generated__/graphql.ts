/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
/** How a work day was recorded. */
export type EntryMode =
  /** Duration typed directly (e.g. 7h30). */
  | 'DURATION'
  /** One or more shifts, duration computed. */
  | 'SLOTS';

/** An entry template. Give durationMinutes in DURATION mode, slots in SLOTS mode. */
export type EntryTemplateInput = {
  durationMinutes?: number | null | undefined;
  /** Making a template the default removes that status from the previous one. */
  isDefault?: boolean;
  label: string;
  mode: EntryMode;
  slots?: Array<ShiftInput>;
};

/** Role of a user. Only given on the server, with artisan commands (RG-13). */
export type Role =
  | 'ADMIN'
  | 'USER';

/** Hours of one day. Give durationMinutes in DURATION mode, shifts in SLOTS mode. */
export type SaveWorkDayInput = {
  date: string;
  durationMinutes?: number | null | undefined;
  mode: EntryMode;
  note?: string | null | undefined;
  shifts?: Array<ShiftInput>;
};

/** A shift as typed by the user. Times are HH:MM within the same day. */
export type ShiftInput = {
  endTime: string;
  startTime: string;
  /** Unpaid break deducted from the shift. Leave 0 when breaks are paid. */
  unpaidBreakMinutes?: number;
};

/** Hours applied to one or several days at once. */
export type WorkDayHoursInput = {
  durationMinutes?: number | null | undefined;
  mode: EntryMode;
  note?: string | null | undefined;
  shifts?: Array<ShiftInput>;
};

export type TeamWorkDayFragment = { __typename: 'WorkDay', id: string, userId: string, date: string, mode: EntryMode, durationMinutes: number, shifts: Array<{ __typename: 'Shift', id: string, startTime: string, endTime: string }> };

export type TeamScheduleQueryVariables = Exact<{
  from: string;
  to: string;
}>;


export type TeamScheduleQuery = { teamMembers: Array<{ __typename: 'User', id: string, name: string }>, teamWorkDays: Array<{ __typename: 'WorkDay', id: string, userId: string, date: string, mode: EntryMode, durationMinutes: number, shifts: Array<{ __typename: 'Shift', id: string, startTime: string, endTime: string }> }> };

export type CurrentUserFragment = { __typename: 'User', id: string, name: string, email: string, role: Role };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { __typename: 'User', id: string, name: string, email: string, role: Role } | null };

export type RegisterMutationVariables = Exact<{
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  locale?: string | null | undefined;
}>;


export type RegisterMutation = { register: { __typename: 'RegisterPayload', email: string } };

export type ResendVerificationEmailMutationVariables = Exact<{
  email: string;
}>;


export type ResendVerificationEmailMutation = { resendVerificationEmail: boolean };

export type CalendarDayFragment = { __typename: 'WorkDay', id: string, date: string, mode: EntryMode, durationMinutes: number, note: string | null, shifts: Array<{ __typename: 'Shift', id: string, startTime: string, endTime: string }> };

export type CalendarQueryVariables = Exact<{
  from: string;
  to: string;
}>;


export type CalendarQuery = { me: { __typename: 'User', id: string, workDays: Array<{ __typename: 'WorkDay', id: string, date: string, mode: EntryMode, durationMinutes: number, note: string | null, shifts: Array<{ __typename: 'Shift', id: string, startTime: string, endTime: string }> }>, hourlyRates: Array<{ __typename: 'HourlyRate', id: string, amountCents: number, effectiveFrom: string }> } | null };

export type HourlyRateFieldsFragment = { __typename: 'HourlyRate', id: string, amountCents: number, effectiveFrom: string };

export type HourlyRatesQueryVariables = Exact<{ [key: string]: never; }>;


export type HourlyRatesQuery = { me: { __typename: 'User', id: string, hourlyRates: Array<{ __typename: 'HourlyRate', id: string, amountCents: number, effectiveFrom: string }> } | null };

export type SetHourlyRateMutationVariables = Exact<{
  amountCents: number;
  effectiveFrom: string;
}>;


export type SetHourlyRateMutation = { setHourlyRate: { __typename: 'HourlyRate', id: string, amountCents: number, effectiveFrom: string } };

export type UpdateHourlyRateMutationVariables = Exact<{
  id: string | number;
  amountCents: number;
  effectiveFrom: string;
}>;


export type UpdateHourlyRateMutation = { updateHourlyRate: { __typename: 'HourlyRate', id: string, amountCents: number, effectiveFrom: string } };

export type DeleteHourlyRateMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteHourlyRateMutation = { deleteHourlyRate: { __typename: 'HourlyRate', id: string } };

export type WorkDayFieldsFragment = { __typename: 'WorkDay', id: string, date: string, mode: EntryMode, durationMinutes: number, note: string | null, shifts: Array<{ __typename: 'Shift', id: string, startTime: string, endTime: string, unpaidBreakMinutes: number }> };

export type EntryTemplateFieldsFragment = { __typename: 'EntryTemplate', id: string, label: string | null, mode: EntryMode, durationMinutes: number | null, isDefault: boolean, slots: Array<{ __typename: 'TemplateSlot', startTime: string, endTime: string, unpaidBreakMinutes: number }> };

export type WorkDayQueryVariables = Exact<{
  date: string;
}>;


export type WorkDayQuery = { me: { __typename: 'User', id: string, workDays: Array<{ __typename: 'WorkDay', id: string, date: string, mode: EntryMode, durationMinutes: number, note: string | null, shifts: Array<{ __typename: 'Shift', id: string, startTime: string, endTime: string, unpaidBreakMinutes: number }> }>, entryTemplates: Array<{ __typename: 'EntryTemplate', id: string, label: string | null, mode: EntryMode, durationMinutes: number | null, isDefault: boolean, slots: Array<{ __typename: 'TemplateSlot', startTime: string, endTime: string, unpaidBreakMinutes: number }> }> } | null };

export type WorkDaysRangeQueryVariables = Exact<{
  from: string;
  to: string;
}>;


export type WorkDaysRangeQuery = { me: { __typename: 'User', id: string, workDays: Array<{ __typename: 'WorkDay', id: string, date: string, durationMinutes: number }>, entryTemplates: Array<{ __typename: 'EntryTemplate', id: string, label: string | null, mode: EntryMode, durationMinutes: number | null, isDefault: boolean, slots: Array<{ __typename: 'TemplateSlot', startTime: string, endTime: string, unpaidBreakMinutes: number }> }> } | null };

export type SaveWorkDayMutationVariables = Exact<{
  input: SaveWorkDayInput;
}>;


export type SaveWorkDayMutation = { saveWorkDay: { __typename: 'WorkDay', id: string, date: string, mode: EntryMode, durationMinutes: number, note: string | null, shifts: Array<{ __typename: 'Shift', id: string, startTime: string, endTime: string, unpaidBreakMinutes: number }> } };

export type SaveWorkDaysMutationVariables = Exact<{
  dates: Array<string> | string;
  hours: WorkDayHoursInput;
}>;


export type SaveWorkDaysMutation = { saveWorkDays: Array<{ __typename: 'WorkDay', id: string, date: string, durationMinutes: number }> };

export type DeleteWorkDayMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteWorkDayMutation = { deleteWorkDay: { __typename: 'WorkDay', id: string } };

export type EntryTemplatesQueryVariables = Exact<{ [key: string]: never; }>;


export type EntryTemplatesQuery = { me: { __typename: 'User', id: string, entryTemplates: Array<{ __typename: 'EntryTemplate', id: string, label: string | null, mode: EntryMode, durationMinutes: number | null, isDefault: boolean, slots: Array<{ __typename: 'TemplateSlot', startTime: string, endTime: string, unpaidBreakMinutes: number }> }> } | null };

export type CreateEntryTemplateMutationVariables = Exact<{
  input: EntryTemplateInput;
}>;


export type CreateEntryTemplateMutation = { createEntryTemplate: { __typename: 'EntryTemplate', id: string, label: string | null, mode: EntryMode, durationMinutes: number | null, isDefault: boolean, slots: Array<{ __typename: 'TemplateSlot', startTime: string, endTime: string, unpaidBreakMinutes: number }> } };

export type UpdateEntryTemplateMutationVariables = Exact<{
  id: string | number;
  input: EntryTemplateInput;
}>;


export type UpdateEntryTemplateMutation = { updateEntryTemplate: { __typename: 'EntryTemplate', id: string, label: string | null, mode: EntryMode, durationMinutes: number | null, isDefault: boolean, slots: Array<{ __typename: 'TemplateSlot', startTime: string, endTime: string, unpaidBreakMinutes: number }> } };

export type DeleteEntryTemplateMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteEntryTemplateMutation = { deleteEntryTemplate: { __typename: 'EntryTemplate', id: string } };

export const TeamWorkDayFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TeamWorkDay"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkDay"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"shifts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}}]}}]}}]} as unknown as DocumentNode<TeamWorkDayFragment, unknown>;
export const CurrentUserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CurrentUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode<CurrentUserFragment, unknown>;
export const CalendarDayFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CalendarDay"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkDay"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"shifts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}}]}}]}}]} as unknown as DocumentNode<CalendarDayFragment, unknown>;
export const HourlyRateFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HourlyRateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"HourlyRate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amountCents"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveFrom"}}]}}]} as unknown as DocumentNode<HourlyRateFieldsFragment, unknown>;
export const WorkDayFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WorkDayFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkDay"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"shifts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"unpaidBreakMinutes"}}]}}]}}]} as unknown as DocumentNode<WorkDayFieldsFragment, unknown>;
export const EntryTemplateFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EntryTemplateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EntryTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"slots"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"unpaidBreakMinutes"}}]}}]}}]} as unknown as DocumentNode<EntryTemplateFieldsFragment, unknown>;
export const TeamScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"from"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"to"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamMembers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teamWorkDays"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TeamWorkDay"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TeamWorkDay"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkDay"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"shifts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}}]}}]}}]} as unknown as DocumentNode<TeamScheduleQuery, TeamScheduleQueryVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CurrentUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CurrentUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const RegisterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Register"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"passwordConfirmation"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"register"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}},{"kind":"Argument","name":{"kind":"Name","value":"passwordConfirmation"},"value":{"kind":"Variable","name":{"kind":"Name","value":"passwordConfirmation"}}},{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<RegisterMutation, RegisterMutationVariables>;
export const ResendVerificationEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResendVerificationEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resendVerificationEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}]}]}}]} as unknown as DocumentNode<ResendVerificationEmailMutation, ResendVerificationEmailMutationVariables>;
export const CalendarDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Calendar"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"from"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"to"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"workDays"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CalendarDay"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"HourlyRateFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CalendarDay"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkDay"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"shifts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HourlyRateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"HourlyRate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amountCents"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveFrom"}}]}}]} as unknown as DocumentNode<CalendarQuery, CalendarQueryVariables>;
export const HourlyRatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HourlyRates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hourlyRates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"HourlyRateFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HourlyRateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"HourlyRate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amountCents"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveFrom"}}]}}]} as unknown as DocumentNode<HourlyRatesQuery, HourlyRatesQueryVariables>;
export const SetHourlyRateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetHourlyRate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amountCents"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"effectiveFrom"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setHourlyRate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"amountCents"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amountCents"}}},{"kind":"Argument","name":{"kind":"Name","value":"effectiveFrom"},"value":{"kind":"Variable","name":{"kind":"Name","value":"effectiveFrom"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"HourlyRateFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HourlyRateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"HourlyRate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amountCents"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveFrom"}}]}}]} as unknown as DocumentNode<SetHourlyRateMutation, SetHourlyRateMutationVariables>;
export const UpdateHourlyRateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateHourlyRate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amountCents"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"effectiveFrom"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateHourlyRate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"amountCents"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amountCents"}}},{"kind":"Argument","name":{"kind":"Name","value":"effectiveFrom"},"value":{"kind":"Variable","name":{"kind":"Name","value":"effectiveFrom"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"HourlyRateFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HourlyRateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"HourlyRate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amountCents"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveFrom"}}]}}]} as unknown as DocumentNode<UpdateHourlyRateMutation, UpdateHourlyRateMutationVariables>;
export const DeleteHourlyRateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteHourlyRate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteHourlyRate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteHourlyRateMutation, DeleteHourlyRateMutationVariables>;
export const WorkDayDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WorkDay"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"date"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"workDays"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"date"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WorkDayFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"entryTemplates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EntryTemplateFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WorkDayFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkDay"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"shifts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"unpaidBreakMinutes"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EntryTemplateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EntryTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"slots"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"unpaidBreakMinutes"}}]}}]}}]} as unknown as DocumentNode<WorkDayQuery, WorkDayQueryVariables>;
export const WorkDaysRangeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WorkDaysRange"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"from"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"to"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"workDays"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"entryTemplates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EntryTemplateFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EntryTemplateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EntryTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"slots"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"unpaidBreakMinutes"}}]}}]}}]} as unknown as DocumentNode<WorkDaysRangeQuery, WorkDaysRangeQueryVariables>;
export const SaveWorkDayDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveWorkDay"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SaveWorkDayInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveWorkDay"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WorkDayFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WorkDayFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkDay"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"shifts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"unpaidBreakMinutes"}}]}}]}}]} as unknown as DocumentNode<SaveWorkDayMutation, SaveWorkDayMutationVariables>;
export const SaveWorkDaysDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveWorkDays"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dates"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hours"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WorkDayHoursInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveWorkDays"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"dates"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dates"}}},{"kind":"Argument","name":{"kind":"Name","value":"hours"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hours"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}}]}}]}}]} as unknown as DocumentNode<SaveWorkDaysMutation, SaveWorkDaysMutationVariables>;
export const DeleteWorkDayDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteWorkDay"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteWorkDay"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteWorkDayMutation, DeleteWorkDayMutationVariables>;
export const EntryTemplatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EntryTemplates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"entryTemplates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EntryTemplateFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EntryTemplateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EntryTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"slots"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"unpaidBreakMinutes"}}]}}]}}]} as unknown as DocumentNode<EntryTemplatesQuery, EntryTemplatesQueryVariables>;
export const CreateEntryTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEntryTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EntryTemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEntryTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EntryTemplateFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EntryTemplateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EntryTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"slots"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"unpaidBreakMinutes"}}]}}]}}]} as unknown as DocumentNode<CreateEntryTemplateMutation, CreateEntryTemplateMutationVariables>;
export const UpdateEntryTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEntryTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EntryTemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEntryTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EntryTemplateFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EntryTemplateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EntryTemplate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"slots"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"unpaidBreakMinutes"}}]}}]}}]} as unknown as DocumentNode<UpdateEntryTemplateMutation, UpdateEntryTemplateMutationVariables>;
export const DeleteEntryTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteEntryTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteEntryTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteEntryTemplateMutation, DeleteEntryTemplateMutationVariables>;