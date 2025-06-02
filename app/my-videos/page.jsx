"use client";

import React from "react";
import { supabase } from "@/lib/supabaseClient"; // Adjust the import path as necessary
import { Button } from "@/components/ui/button"; // Assuming you have a Button component
import { Textarea } from "@/components/ui/textarea"; // Assuming you have a Textarea component
import { useRouter } from "next/navigation"; // Adjust the import path as necessary

const Page = () => {
  const [prompt, setPrompt] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const handleSubmit = async () => {
    setLoading(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      alert("You must be logged in to generate a video.");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("prompts")
      .insert({
        prompt_text: prompt,
        user_id: user.id,
      })
      .select()
      .single();
    setLoading(false);
    if (error) {
      console.error("Error inserting prompt:", error);
      alert("Failed to generate script. Please try again.");    } else {
      alert("Script generation started successfully!");
      console.log("Inserted prompt:", data);
      // You can redirect or update the UI as needed
    }
    router.push(`/generated-script?id=${data.id}`); // Redirect to the generated script page with prompt ID
  };

  return (
    <div>
      <h1>My videos</h1>
      <Textarea
        placeholder="Enter prompt to generate video"
        className="w-full max-w-2xl mb-4"
        onChange={(e) => setPrompt(e.target.value)}
      />{" "}
      <Button className="mb-4" onClick={handleSubmit} disabled={loading}>
        {loading ? "Generating..." : "Generate Script"}
      </Button>
    </div>
  );
};

export default Page;
