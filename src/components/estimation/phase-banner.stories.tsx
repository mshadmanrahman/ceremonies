import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PhaseBanner } from "./phase-banner";

const meta = {
  title: "Estimation/PhaseBanner",
  component: PhaseBanner,
  tags: ["autodocs"],
  argTypes: {
    phase: {
      control: "select",
      options: ["waiting", "voting", "revealed", "discussing", "agreed"],
    },
  },
} satisfies Meta<typeof PhaseBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Waiting: Story = { args: { phase: "waiting" } };
export const Voting: Story = { args: { phase: "voting" } };
export const Revealed: Story = { args: { phase: "revealed" } };
export const Discussing: Story = { args: { phase: "discussing" } };
export const Agreed: Story = { args: { phase: "agreed" } };

export const AllPhases: Story = {
  args: { phase: "waiting" },
  render: () => (
    <div className="flex flex-wrap gap-3">
      <PhaseBanner phase="waiting" />
      <PhaseBanner phase="voting" />
      <PhaseBanner phase="revealed" />
      <PhaseBanner phase="discussing" />
      <PhaseBanner phase="agreed" />
    </div>
  ),
};
