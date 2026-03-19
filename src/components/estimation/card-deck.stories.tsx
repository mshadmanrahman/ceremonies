import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CardDeck } from "./card-deck";
import type { CardValue } from "@/lib/state-machines/estimation";

const meta = {
  title: "Estimation/CardDeck",
  component: CardDeck,
  tags: ["autodocs"],
  args: {
    selected: null,
    disabled: false,
    onSelect: () => {},
  },
} satisfies Meta<typeof CardDeck>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<CardValue | null>(args.selected);
    return <CardDeck {...args} selected={selected} onSelect={setSelected} />;
  },
};

export const WithSelection: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<CardValue | null>("5");
    return <CardDeck {...args} selected={selected} onSelect={setSelected} />;
  },
};

export const Disabled: Story = {
  render: () => {
    return <CardDeck selected="8" onSelect={() => {}} disabled />;
  },
};

export const CoffeeSelected: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<CardValue | null>("coffee");
    return <CardDeck {...args} selected={selected} onSelect={setSelected} />;
  },
};
