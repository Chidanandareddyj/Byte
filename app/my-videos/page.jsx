"use client";

import React from "react";
import { supabase } from "@/lib/supabaseClient"; // Adjust the import path as necessary
import { Button } from "@/components/ui/button"; // Assuming you have a Button component
import { Textarea } from "@/components/ui/textarea"; // Assuming you have a Textarea component
import { useRouter } from "next/navigation"; // Adjust the import path as necessary
import Silk from "@/components/ui/Silk";
import { Navbar } from "@/components/Navbar";

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
    <div className="relative min-h-screen flex flex-col">
      {/* Silk background */}
      <div className="absolute inset-0 -z-10">
        <Silk speed={5} scale={1} color="#7CA3C7" noiseIntensity={0.2} rotation={0.14} />
      </div>
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24">
        <div className="bg-white/20 backdrop-blur-md rounded-xl shadow-lg p-8 md:p-12 w-full max-w-2xl flex flex-col items-center animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 font-playfair text-center drop-shadow-lg">My Videos</h1>
          <Textarea
            placeholder="Enter prompt to generate video"
            className="w-full mb-4 bg-white/30 text-gray-900 placeholder-gray-500 rounded-lg border border-white/30 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all min-h-[120px]"
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Button
            className="w-full md:w-auto mb-4 bg-white/20 backdrop-blur-md text-white hover:bg-white/30 rounded-md px-8 py-3 text-lg border border-white/30 transition-all duration-300 hover:scale-105 font-sans"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Script"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Page;
