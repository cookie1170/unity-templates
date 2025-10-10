export const scriptTemplates: ScriptTemplate[] = [
    {
        value: "1-Scripting__MonoBehaviour Script-NewMonoBehaviourScript.cs.txt",
        displayName: "MonoBehaviour Script",
    },
    {
        value: "2-Scripting__ScriptableObject Script-NewScriptableObjectScript.cs.txt",
        displayName: "ScriptableObject Script",
    },
    { value: "3-Scripting__Empty C# Script-NewEmptyCSharpScript.cs.txt", displayName: "Empty C# Script" },
    { value: "4-Shader__Compute Shader-NewComputeShader.compute.txt", displayName: "Compute Shader" },
    {
        value: "1-Scripting__Playables__Playable Behaviour Script-NewPlayableBehaviour.cs.txt",
        displayName: "Playable Behaviour Script",
    },
    {
        value: "1-Shader__Standard Surface Shader-NewSurfaceShader.shader.txt",
        displayName: "Standard Surface Shader",
    },
    {
        value: "2-Scripting__Playables__Playable Asset Script-NewPlayableAsset.cs.txt",
        displayName: "Playable Asset Script",
    },
    { value: "2-Shader__Unlit Shader-NewUnlitShader.shader.txt", displayName: "Unlit Shader" },
    {
        value: "3-Scripting__MonoBehaviour Script-NewTestScript.cs.txt",
        displayName: "MonoBehaviour Test Script",
    },
    {
        value: "3-Shader__Image Effect Shader-NewImageEffectShader.shader.txt",
        displayName: "Image Effect Shader",
    },
    {
        value: "5-Shader__Ray Tracing Shader-NewRayTracingShader.raytrace.txt",
        displayName: "Ray Tracing Shader",
    },
    {
        value: "6-Scripting__MonoBehaviour Script-NewStateMachineBehaviourScript.cs.txt",
        displayName: "State Machine Behaviour Script",
    },
    {
        value: "6-Scripting__MonoBehaviour Script-NewSubStateMachineBehaviourScript.cs.txt",
        displayName: "Sub State Machine Behaviour Script",
    },
    {
        value: "20-Scripting__Assembly Definition-NewEditModeTestAssembly.asmdef.txt",
        displayName: "Edit Mode Test Assembly",
    },
    {
        value: "21-Scripting__Assembly Definition-NewTestAssembly.asmdef.txt",
        displayName: "Test Assembly",
    },
    {
        value: "22-Scripting__Assembly Definition-NewAssembly.asmdef.txt",
        displayName: "Assembly Definition",
    },
    {
        value: "23-Scripting__Assembly Definition Reference-NewAssemblyReference.asmref.txt",
        displayName: "Assembly Definition Reference",
    },
    {
        value: "103-Scene__Scene Template Pipeline-NewSceneTemplatePipeline.cs.txt",
        displayName: "Scene Template Pipeline",
    },
];

export type ScriptTemplate = {
    value: string;
    displayName: string;
};
