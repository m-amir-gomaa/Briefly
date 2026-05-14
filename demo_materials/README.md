# Briefly Platform: Demo Guide

Everything you need to successfully pitch and demonstrate the Briefly platform is right here in this folder.

## Included Materials

1. **`presentation_script.md`**: Contains your spoken script, timed out step-by-step, as well as the intricate UML Architecture diagram to show the technical audience at the end of the demo.
2. **`client_email.txt`**: A sample unstructured, messy email from a "client" outlining requirements for a fitness app.
3. **`client_wireframe.png`**: A messy whiteboard sketch of the fitness app.

## How to Run the Demo

**Pre-requisites**: Ensure your VM is running and `https://briefly-vm.tail0c7099.ts.net/` is accessible (we verified this earlier).

**Step 1: Set the Stage**
Open `presentation_script.md` on a secondary screen or tablet so you can read along. Start by showing the audience the `client_email.txt` and `client_wireframe.png` on your screen. Explain how chaotic client input usually is.

**Step 2: Open the Platform**
Navigate to `https://briefly-vm.tail0c7099.ts.net/` in your browser. Log in using your Google account to access the dashboard.

**Step 3: The "Magic" Moment**
Click "New Intake" in the UI. 
1. Open the folder containing these demo materials on your computer.
2. **Drag and drop** both `client_email.txt` and `client_wireframe.png` simultaneously into the intake dropzone.
3. Click **Submit**.

**Step 4: Real-Time SSE**
Do not touch the mouse! Let the audience watch the live, real-time updates as the Python workers process the files in parallel and stream the status back via Server-Sent Events (SSE). Keep talking through the script.

**Step 5: The Reveal**
Once finished, click into the generated brief. Walk the audience through the structured goals, the identified features, and critically, the "Ambiguities" that the AI flagged from the messy text.

**Step 6: Technical Deep Dive**
Finally, open the `presentation_script.md` file and scroll to the intricate UML diagram. Walk the technical judges through your architecture: Edge caching, Go concurrency, Redis decoupled queues, and Python LangGraph parallelization.

Good luck! You're ready to win this.
