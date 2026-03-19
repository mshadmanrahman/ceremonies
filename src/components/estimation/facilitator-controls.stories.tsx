import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FacilitatorControls } from "./facilitator-controls";
import type { EstimationState } from "@/lib/state-machines/estimation";
import { fn } from "storybook/test";

const BASE_PARTICIPANTS = [
  { id: "1", name: "Shadman", joinedAt: Date.now() },
  { id: "2", name: "Alice", joinedAt: Date.now() },
  { id: "3", name: "Bob", joinedAt: Date.now() },
];

const BASE_STATE: EstimationState = {
  phase: "voting",
  facilitatorId: "1",
  ticket: { ref: "CER-42", title: "Add dark mode toggle" },
  votes: [],
  finalEstimate: null,
  participants: BASE_PARTICIPANTS,
  history: [],
};

const meta = {
  title: "Estimation/FacilitatorControls",
  component: FacilitatorControls,
  tags: ["autodocs"],
  args: {
    isFacilitator: true,
    nudgeReceived: false,
    onReveal: fn(),
    onDiscuss: fn(),
    onAgree: fn(),
    onNextTicket: fn(),
    onRevote: fn(),
  },
} satisfies Meta<typeof FacilitatorControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VotingPartial: Story = {
  args: {
    state: {
      ...BASE_STATE,
      votes: [
        { odiedId: "1", odiedName: "Shadman", value: "3", votedAt: Date.now() },
      ],
    },
  },
};

export const VotingAllIn: Story = {
  args: {
    state: {
      ...BASE_STATE,
      votes: [
        { odiedId: "1", odiedName: "Shadman", value: "3", votedAt: Date.now() },
        { odiedId: "2", odiedName: "Alice", value: "5", votedAt: Date.now() },
        { odiedId: "3", odiedName: "Bob", value: "3", votedAt: Date.now() },
      ],
    },
  },
};

export const VotingWithNudge: Story = {
  args: {
    state: {
      ...BASE_STATE,
      votes: [
        { odiedId: "1", odiedName: "Shadman", value: "3", votedAt: Date.now() },
        { odiedId: "2", odiedName: "Alice", value: "5", votedAt: Date.now() },
        { odiedId: "3", odiedName: "Bob", value: "3", votedAt: Date.now() },
      ],
    },
    nudgeReceived: true,
  },
};

export const Revealed: Story = {
  args: {
    state: { ...BASE_STATE, phase: "revealed" },
  },
};

export const Discussing: Story = {
  args: {
    state: { ...BASE_STATE, phase: "discussing" },
  },
};

export const Agreed: Story = {
  args: {
    state: { ...BASE_STATE, phase: "agreed", finalEstimate: "5" },
  },
};

export const NotFacilitator: Story = {
  args: {
    state: BASE_STATE,
    isFacilitator: false,
  },
};
