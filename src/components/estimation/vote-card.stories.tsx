import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { VoteCard } from "./vote-card";

const meta = {
  title: "Estimation/VoteCard",
  component: VoteCard,
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: "select",
      options: [null, "coffee", "1", "2", "3", "4", "5", "8", "13", "question"],
    },
  },
  args: {
    name: "Shadman",
    value: null,
    revealed: false,
    isYou: false,
    index: 0,
  },
} satisfies Meta<typeof VoteCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Waiting: Story = {
  args: {
    name: "Alice",
    value: null,
    revealed: false,
  },
};

export const VotedHidden: Story = {
  args: {
    name: "Bob",
    value: "5",
    revealed: false,
  },
};

export const RevealedWithValue: Story = {
  args: {
    name: "Carol",
    value: "8",
    revealed: true,
  },
};

export const RevealedNoVote: Story = {
  args: {
    name: "Dave",
    value: null,
    revealed: true,
  },
};

export const CoffeeCard: Story = {
  args: {
    name: "Eve",
    value: "coffee",
    revealed: true,
  },
};

export const QuestionCard: Story = {
  args: {
    name: "Frank",
    value: "question",
    revealed: true,
  },
};

export const IsYou: Story = {
  args: {
    name: "Shadman",
    value: "3",
    revealed: true,
    isYou: true,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <VoteCard name="Waiting" value={null} revealed={false} index={0} />
      <VoteCard name="Voted" value="5" revealed={false} index={1} />
      <VoteCard name="Revealed" value="8" revealed={true} index={2} />
      <VoteCard name="No vote" value={null} revealed={true} index={3} />
      <VoteCard name="You" value="3" revealed={true} isYou index={4} />
    </div>
  ),
};
