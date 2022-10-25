import type { Block, KnownBlock } from '@slack/web-api';

// https://api.slack.com/reference/interaction-payloads/shortcuts
export interface ShortCutPayload {
  type: 'shortcut' | 'message_action';
  trigger_id: string;
  team: { id: string };
}

export interface InteractionView {
  id: string;
  type: 'modal';
  state: { values: any };
}

// https://api.slack.com/reference/interaction-payloads/views#view_submission
export interface InteractionPayload {
  type: 'view_submission';
  team: { id: string };
  user: { id: string };
  view: InteractionView;
}

export interface BlockActionView {
  id: string;
  type: 'modal';
  blocks: (Block | KnownBlock)[];
  previous_view_id: string | null;
  root_view_id: string;
}

export interface BlockActionPayload {
  type: 'block_actions';
  team: { id: string };
  view: BlockActionView;
  actions: { selected_option: { value: string } }[];
}

export interface SlackModalData {
  userOption: string;
  receiveUsers: string[];
  tagIds: string[];
  url: string;
  content: string;
  tagMessage: string;
}
