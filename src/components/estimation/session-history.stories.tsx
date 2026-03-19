import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SessionHistory } from "./session-history";
import type { CompletedEstimate } from "@/lib/state-machines/estimation";

const meta = {
  title: "Estimation/SessionHistory",
  component: SessionHistory,
  tags: ["autodocs"],
} satisfies Meta<typeof SessionHistory>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_HISTORY: ReadonlyArray<CompletedEstimate> = [
  {
    ticket: { ref: "CER-101", title: "Add retro board" },
    finalEstimate: "3",
    participantCount: 4,
    completedAt: Date.now() - 300_000,
  },
  {
    ticket: { ref: "CER-102", title: "PartyKit reconnect logic" },
    finalEstimate: "8",
    participantCount: 4,
    completedAt: Date.now() - 200_000,
  },
  {
    ticket: { ref: "CER-103", title: "Facilitator rotation" },
    finalEstimate: "5",
    participantCount: 5,
    completedAt: Date.now() - 100_000,
  },
  {
    ticket: { ref: "Quick vote", title: "Quick estimate" },
    finalEstimate: "coffee",
    participantCount: 3,
    completedAt: Date.now() - 50_000,
  },
];

export const Empty: Story = {
  args: { history: [] },
};

export const WithHistory: Story = {
  args: { history: SAMPLE_HISTORY },
};

export const SingleItem: Story = {
  args: { history: [SAMPLE_HISTORY[0]] },
};

export const ManyItems: Story = {
  args: {
    history: [
      ...SAMPLE_HISTORY,
      ...SAMPLE_HISTORY.map((h, i) => ({
        ...h,
        ticket: { ...h.ticket, ref: `CER-${200 + i}` },
        completedAt: Date.now(),
      })),
    ],
  },
};
