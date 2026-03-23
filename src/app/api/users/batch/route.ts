import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const userIds: string[] = body.userIds;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "userIds array required" }, { status: 400 });
  }

  // Limit to 100 users per request
  const ids = userIds.slice(0, 100);

  try {
    const client = await clerkClient();
    const response = await client.users.getUserList({
      userId: ids,
      limit: 100,
    });

    const users: Record<string, { name: string; imageUrl: string | null }> = {};
    for (const user of response.data) {
      const firstName = user.firstName ?? "";
      const lastName = user.lastName ?? "";
      const name =
        `${firstName} ${lastName}`.trim() ||
        user.emailAddresses[0]?.emailAddress?.split("@")[0] ||
        "Unknown";
      users[user.id] = {
        name,
        imageUrl: user.imageUrl ?? null,
      };
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[users/batch] Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
