export type ScriptTemplate = {
    value: string;
    displayName: string;
    defaultValue: string;
};

export function getTemplateFromValue(value: string): ScriptTemplate {
    const templateIndex = scriptTemplates.findIndex((template) => template.value == value);

    if (templateIndex == -1) {
        throw new Error(`Can't find template ${value}`);
    }

    return scriptTemplates[templateIndex];
}

export const scriptTemplates: ScriptTemplate[] = [
    {
        value: "1-Scripting__MonoBehaviour Script-NewMonoBehaviourScript.cs.txt",
        displayName: "MonoBehaviour Script",
        defaultValue: `using UnityEngine;

    #ROOTNAMESPACEBEGIN#
public class #SCRIPTNAME# : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        #NOTRIM#
    }

    // Update is called once per frame
    void Update()
    {
        #NOTRIM#
    }
}
#ROOTNAMESPACEEND#
`,
    },
    {
        value: "2-Scripting__ScriptableObject Script-NewScriptableObjectScript.cs.txt",
        displayName: "ScriptableObject Script",
        defaultValue: `using UnityEngine;

    #ROOTNAMESPACEBEGIN#
[CreateAssetMenu(fileName = "#SCRIPTNAME#", menuName = "Scriptable Objects/#SCRIPTNAME#")]
public class #SCRIPTNAME# : ScriptableObject
{
    #NOTRIM#
}
#ROOTNAMESPACEEND#
`,
    },

    {
        value: "3-Scripting__MonoBehaviour Script-NewTestScript.cs.txt",
        displayName: "Test Script",
        defaultValue: `using System.Collections;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;

    #ROOTNAMESPACEBEGIN#
public class #SCRIPTNAME#
{
    // A Test behaves as an ordinary method
    [Test]
    public void #SCRIPTNAME#SimplePasses()
    {
        // Use the Assert class to test conditions
    }

    // A UnityTest behaves like a coroutine in Play Mode. In Edit Mode you can use
    // \`yield return null;\` to skip a frame.
    [UnityTest]
    public IEnumerator #SCRIPTNAME#WithEnumeratorPasses()
    {
        // Use the Assert class to test conditions.
        // Use yield to skip a frame.
        yield return null;
    }
}
#ROOTNAMESPACEEND#
`,
    },
    {
        value: "3-Scripting__Empty C# Script-NewEmptyCSharpScript.cs.txt",
        displayName: "Empty C# Script",
        defaultValue: `using UnityEngine;

    #ROOTNAMESPACEBEGIN#
public class #SCRIPTNAME#
{
    #NOTRIM#
}
#ROOTNAMESPACEEND#
`,
    },
    {
        value: "4-Shader__Compute Shader-NewComputeShader.compute.txt",
        displayName: "Compute Shader",
        defaultValue: `// Each #kernel tells which function to compile; you can have many kernels
#pragma kernel CSMain

// Create a RenderTexture with enableRandomWrite flag and set it
// with cs.SetTexture
RWTexture2D<float4> Result;

[numthreads(8,8,1)]
void CSMain (uint3 id : SV_DispatchThreadID)
{
    // TODO: insert actual code here!

    Result[id.xy] = float4(id.x & id.y, (id.x & 15)/15.0, (id.y & 15)/15.0, 0.0);
}
`,
    },
    {
        value: "1-Shader__Standard Surface Shader-NewSurfaceShader.shader.txt",
        displayName: "Standard Surface Shader",
        defaultValue: `Shader "Custom/#NAME#"
{
    Properties
    {
        _Color ("Color", Color) = (1,1,1,1)
        _MainTex ("Albedo (RGB)", 2D) = "white" {}
        _Glossiness ("Smoothness", Range(0,1)) = 0.5
        _Metallic ("Metallic", Range(0,1)) = 0.0
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 200

        CGPROGRAM
        // Physically based Standard lighting model, and enable shadows on all light types
        #pragma surface surf Standard fullforwardshadows

        // Use shader model 3.0 target, to get nicer looking lighting
        #pragma target 3.0

        sampler2D _MainTex;

        struct Input
        {
            float2 uv_MainTex;
        };

        half _Glossiness;
        half _Metallic;
        fixed4 _Color;

        // Add instancing support for this shader. You need to check 'Enable Instancing' on materials that use the shader.
        // See https://docs.unity3d.com/Manual/GPUInstancing.html for more information about instancing.
        // #pragma instancing_options assumeuniformscaling
        UNITY_INSTANCING_BUFFER_START(Props)
            // put more per-instance properties here
        UNITY_INSTANCING_BUFFER_END(Props)

        void surf (Input IN, inout SurfaceOutputStandard o)
        {
            // Albedo comes from a texture tinted by color
            fixed4 c = tex2D (_MainTex, IN.uv_MainTex) * _Color;
            o.Albedo = c.rgb;
            // Metallic and smoothness come from slider variables
            o.Metallic = _Metallic;
            o.Smoothness = _Glossiness;
            o.Alpha = c.a;
        }
        ENDCG
    }
    FallBack "Diffuse"
}
`,
    },
    {
        value: "2-Shader__Unlit Shader-NewUnlitShader.shader.txt",
        displayName: "Unlit Shader",
        defaultValue: `Shader "Unlit/#NAME#"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 100

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            // make fog work
            #pragma multi_compile_fog

            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                UNITY_FOG_COORDS(1)
                float4 vertex : SV_POSITION;
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;

            v2f vert (appdata v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                UNITY_TRANSFER_FOG(o,o.vertex);
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                // sample the texture
                fixed4 col = tex2D(_MainTex, i.uv);
                // apply fog
                UNITY_APPLY_FOG(i.fogCoord, col);
                return col;
            }
            ENDCG
        }
    }
}
`,
    },
    {
        value: "3-Shader__Image Effect Shader-NewImageEffectShader.shader.txt",
        displayName: "Image Effect Shader",
        defaultValue: `Shader "Hidden/#NAME#"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
    }
    SubShader
    {
        // No culling or depth
        Cull Off ZWrite Off ZTest Always

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 vertex : SV_POSITION;
            };

            v2f vert (appdata v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = v.uv;
                return o;
            }

            sampler2D _MainTex;

            fixed4 frag (v2f i) : SV_Target
            {
                fixed4 col = tex2D(_MainTex, i.uv);
                // just invert the colors
                col.rgb = 1 - col.rgb;
                return col;
            }
            ENDCG
        }
    }
}
`,
    },
    {
        value: "5-Shader__Ray Tracing Shader-NewRayTracingShader.raytrace.txt",
        displayName: "Ray Tracing Shader",
        defaultValue: `RWTexture2D<float4> RenderTarget;

// Uncomment this pragma for debugging the HLSL code in PIX. GPU performance will be impacted.
//#pragma enable_ray_tracing_shader_debug_symbols

#pragma max_recursion_depth 1

[shader("raygeneration")]
void MyRaygenShader()
{
    uint2 dispatchIdx = DispatchRaysIndex().xy;
   
    RenderTarget[dispatchIdx] = float4(dispatchIdx.x & dispatchIdx.y, (dispatchIdx.x & 15)/15.0, (dispatchIdx.y & 15)/15.0, 0.0);
}
`,
    },
    {
        value: "6-Scripting__MonoBehaviour Script-NewStateMachineBehaviourScript.cs.txt",
        displayName: "State Machine Behaviour Script",
        defaultValue: `using UnityEngine;

    #ROOTNAMESPACEBEGIN#
public class #SCRIPTNAME# : StateMachineBehaviour
{
    // OnStateEnter is called when a transition starts and the state machine starts to evaluate this state
    //override public void OnStateEnter(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    //{
    //    #NOTRIM#
    //}

    // OnStateUpdate is called on each Update frame between OnStateEnter and OnStateExit callbacks
    //override public void OnStateUpdate(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    //{
    //    #NOTRIM#
    //}

    // OnStateExit is called when a transition ends and the state machine finishes evaluating this state
    //override public void OnStateExit(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    //{
    //    #NOTRIM#
    //}

    // OnStateMove is called right after Animator.OnAnimatorMove()
    //override public void OnStateMove(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    //{
    //    // Implement code that processes and affects root motion
    //}

    // OnStateIK is called right after Animator.OnAnimatorIK()
    //override public void OnStateIK(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    //{
    //    // Implement code that sets up animation IK (inverse kinematics)
    //}
}
#ROOTNAMESPACEEND#
`,
    },
    {
        value: "6-Scripting__MonoBehaviour Script-NewSubStateMachineBehaviourScript.cs.txt",
        displayName: "Sub State Machine Behaviour Script",
        defaultValue: `using UnityEngine;

    #ROOTNAMESPACEBEGIN#
public class #SCRIPTNAME# : StateMachineBehaviour
{
    // OnStateEnter is called before OnStateEnter is called on any state inside this state machine
    //override public void OnStateEnter(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    //{
    //    #NOTRIM#
    //}

    // OnStateUpdate is called before OnStateUpdate is called on any state inside this state machine
    //override public void OnStateUpdate(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    //{
    //    #NOTRIM#
    //}

    // OnStateExit is called before OnStateExit is called on any state inside this state machine
    //override public void OnStateExit(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    //{
    //    #NOTRIM#
    //}

    // OnStateMove is called before OnStateMove is called on any state inside this state machine
    //override public void OnStateMove(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    //{
    //    #NOTRIM#
    //}

    // OnStateIK is called before OnStateIK is called on any state inside this state machine
    //override public void OnStateIK(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    //{
    //    #NOTRIM#
    //}

    // OnStateMachineEnter is called when entering a state machine via its Entry Node
    //override public void OnStateMachineEnter(Animator animator, int stateMachinePathHash)
    //{
    //    #NOTRIM#
    //}

    // OnStateMachineExit is called when exiting a state machine via its Exit Node
    //override public void OnStateMachineExit(Animator animator, int stateMachinePathHash)
    //{
    //    #NOTRIM#
    //}
}
#ROOTNAMESPACEEND#
`,
    },
    {
        value: "20-Scripting__Assembly Definition-NewEditModeTestAssembly.asmdef.txt",
        displayName: "Edit Mode Test Assembly",
        defaultValue: `{
    "name": "#SCRIPTNAME#",
    "optionalUnityReferences": [
        "TestAssemblies"
    ],
    "includePlatforms": [
        "Editor"
    ]
}`,
    },
    {
        value: "21-Scripting__Assembly Definition-NewTestAssembly.asmdef.txt",
        displayName: "Test Assembly",
        defaultValue: `{
    "name": "#SCRIPTNAME#",
    "optionalUnityReferences": [
        "TestAssemblies"
    ]
}
`,
    },
    {
        value: "22-Scripting__Assembly Definition-NewAssembly.asmdef.txt",
        displayName: "Assembly Definition",
        defaultValue: `{
	"name": "#SCRIPTNAME#"
}
`,
    },
    {
        value: "23-Scripting__Assembly Definition Reference-NewAssemblyReference.asmref.txt",
        displayName: "Assembly Definition Reference",
        defaultValue: `{
    "reference": ""
}`,
    },
    {
        value: "103-Scene__Scene Template Pipeline-NewSceneTemplatePipeline.cs.txt",
        displayName: "Scene Template Pipeline",
        defaultValue: `using UnityEditor.SceneTemplate;
using UnityEngine;
using UnityEngine.SceneManagement;

    #ROOTNAMESPACEBEGIN#
public class #SCRIPTNAME# : ISceneTemplatePipeline
{
    public virtual bool IsValidTemplateForInstantiation(SceneTemplateAsset sceneTemplateAsset)
    {
        return true;
    }

    public virtual void BeforeTemplateInstantiation(SceneTemplateAsset sceneTemplateAsset, bool isAdditive, string sceneName)
    {
        #NOTRIM#
    }

    public virtual void AfterTemplateInstantiation(SceneTemplateAsset sceneTemplateAsset, Scene scene, bool isAdditive, string sceneName)
    {
        #NOTRIM#
    }
}
#ROOTNAMESPACEEND#
`,
    },
    {
        value: "1-Scripting__Playables__Playable Behaviour Script-NewPlayableBehaviour.cs.txt",
        displayName: "Playable Behaviour Script",
        defaultValue: `using UnityEngine;
using UnityEngine.Playables;

    #ROOTNAMESPACEBEGIN#
// A behaviour that is attached to a playable
public class #SCRIPTNAME# : PlayableBehaviour
{
    // Called when the owning graph starts playing
    public override void OnGraphStart(Playable playable)
    {
        #NOTRIM#
    }

    // Called when the owning graph stops playing
    public override void OnGraphStop(Playable playable)
    {
        #NOTRIM#
    }

    // Called when the state of the playable is set to Play
    public override void OnBehaviourPlay(Playable playable, FrameData info)
    {
        #NOTRIM#
    }

    // Called when the state of the playable is set to Paused
    public override void OnBehaviourPause(Playable playable, FrameData info)
    {
        #NOTRIM#
    }

    // Called each frame while the state is set to Play
    public override void PrepareFrame(Playable playable, FrameData info)
    {
        #NOTRIM#
    }
}
#ROOTNAMESPACEEND#
`,
    },
    {
        value: "2-Scripting__Playables__Playable Asset Script-NewPlayableAsset.cs.txt",
        displayName: "Playable Asset Script",
        defaultValue: `using UnityEngine;
using UnityEngine.Playables;

    #ROOTNAMESPACEBEGIN#
[System.Serializable]
public class #SCRIPTNAME# : PlayableAsset
{
    // Factory method that generates a playable based on this asset
    public override Playable CreatePlayable(PlayableGraph graph, GameObject go)
    {
        return Playable.Create(graph);
    }
}
#ROOTNAMESPACEEND#
`,
    },
];
