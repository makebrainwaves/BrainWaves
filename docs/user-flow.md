# BrainWaves User Flow

This document describes the user flow through the BrainWaves application — an Electron desktop app for conducting EEG neuroscience experiments.

## Flow Diagram

```mermaid
flowchart TD
    HOME["🏠 HOME"]
    HOME --> MY_EXP["MY EXPERIMENTS\n(saved workspaces)"]
    HOME --> EXP_BANK["EXPERIMENT BANK\n(built-in cards)"]
    HOME --> EXPLORE["EXPLORE EEG DATA\n(raw streaming)"]

    MY_EXP -->|"Open Experiment"| DESIGN
    EXP_BANK -->|"Pick card → Overview → Start"| DESIGN

    EXPLORE --> CONNECT_MODAL_EXP["ConnectModal\n(find & connect device)"]
    CONNECT_MODAL_EXP --> EEG_EXPLORE["Live EEG Viewer\n(signal quality + waveform)"]

    subgraph DESIGN ["📋 DESIGN  /design"]
        direction TB
        D_OV["OVERVIEW\n(title, description)"]
        D_BG["BACKGROUND\n(framing questions, resources)"]
        D_PR["PROTOCOL\n(step-by-step, condition images)"]
        D_PV["PREVIEW\n(live experiment iframe)"]
        D_OV --> D_BG --> D_PR --> D_PV
        EEG_TOGGLE["Enable/Disable EEG toggle"]
    end

    DESIGN -->|"Top nav: Collect"| COLLECT

    subgraph COLLECT ["🎧 COLLECT  /collect"]
        direction TB
        PRE_TEST["PRE-TEST\n(signal quality + EEG viewer)"]
        CONNECT_MODAL["ConnectModal\n① power on headset\n② plug in USB receiver\n③ select device → connect"]
        PRE_TEST -->|"EEG enabled & not connected"| CONNECT_MODAL
        CONNECT_MODAL -->|"Connected"| PRE_TEST
        PRE_TEST -->|"Run & Record"| RUN
        RUN["RUN\n(subject ID / group / session)"]
        EXP_WINDOW["ExperimentWindow\n(full-screen lab.js iframe\n+ EEG timing markers)"]
        RUN -->|"Run Experiment"| EXP_WINDOW
        EXP_WINDOW -->|"Experiment complete\n(behavioral CSV saved)"| DONE_COLLECT["Recording saved ✓"]
    end

    DONE_COLLECT -->|"EEG enabled\nTop nav: Clean"| CLEAN
    DONE_COLLECT -->|"Behavior only\nTop nav: Analyze"| ANALYZE

    subgraph CLEAN ["🧹 CLEAN  /clean\n(EEG only)"]
        direction TB
        CL_SEL["Select subject\n+ select recording(s)"]
        CL_LOAD["Load Dataset\n(Pyodide → epoch stats)"]
        CL_CLEAN["Clean Data\n(artifact rejection in Pyodide)"]
        CL_SEL --> CL_LOAD --> CL_CLEAN
    end

    CLEAN -->|"Analyze Dataset →"| ANALYZE

    subgraph ANALYZE ["📊 ANALYZE  /analyze"]
        direction TB
        AN_OV["OVERVIEW\n(topoplot — scalp map)"]
        AN_ERP["ERP\n(waveform by electrode)"]
        AN_BEH["BEHAVIOR\n(RT / Accuracy charts\nbar · box · scatter)"]
        AN_EXP["Export aggregated data"]
        AN_OV --> AN_ERP
        AN_ERP --> AN_BEH
        AN_BEH --> AN_EXP
    end

    DESIGN -->|"Home button"| HOME
    COLLECT -->|"Home button"| HOME
    CLEAN -->|"Home button"| HOME
    ANALYZE -->|"Home button"| HOME

    style HOME fill:#4A90D9,color:#fff
    style DESIGN fill:#7B68EE,color:#fff
    style COLLECT fill:#E8763A,color:#fff
    style CLEAN fill:#3BAF7A,color:#fff
    style ANALYZE fill:#D95B5B,color:#fff
```

## Stage Descriptions

### 1. Home (`/` and `/home`)

Entry point with three tabs:

- **My Experiments** — table of previously saved workspaces; each row has Delete, Go to Folder, and Open Experiment actions.
- **Experiment Bank** — card grid of four built-in EEG paradigms: Faces/Houses (N170), Stroop Task, Multi-tasking, and Visual Search. Clicking a card opens an Overview panel before starting.
- **Explore EEG Data** — connects directly to a headset and streams live EEG without running a formal experiment.

### 2. Design (`/design`)

Four review tabs walk the researcher through the experiment before data collection:

| Tab | Content |
|---|---|
| **Overview** | Title and experiment description |
| **Background** | Framing questions and external reading resources |
| **Protocol** | Step-by-step instructions with condition images |
| **Preview** | Live experiment iframe (lab.js) |

An **Enable EEG** toggle controls whether the Clean step appears downstream. Custom experiments have additional tabs for configuring conditions, trials, timing parameters, and instructions.

### 3. Collect (`/collect`)

Two sub-views:

- **Pre-Test** — walks the user through `ConnectModal` (power on headset → plug in USB receiver → select device → connect), then shows live signal quality and a real-time EEG waveform.
- **Run** — collects subject ID, group name, and session number, then launches the experiment in a full-screen iframe. EEG timing markers are injected during the task. On completion, the behavioral CSV is saved automatically.

### 4. Clean (`/clean`) — EEG only

Shown only when EEG is enabled.

1. Select a subject and one or more recordings.
2. **Load Dataset** — loads epochs into Pyodide (Python-in-browser) and returns epoch statistics.
3. **Clean Data** — runs artifact rejection via Pyodide. Once the drop percentage reaches a threshold, the *Analyze Dataset* button becomes available.

### 5. Analyze (`/analyze`)

- **EEG mode** — three tabs: topoplot (scalp map overview), ERP waveforms per electrode, and behavioral analysis.
- **Behavior-only mode** — one tab: interactive bar, box, or scatter plots for response time or accuracy, with an outlier-removal option and an export button.
