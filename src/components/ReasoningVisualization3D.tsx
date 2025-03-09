import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

interface Stage {
  title: string
  description: string
  summary: string
  icon: React.ElementType
}

interface ReasoningVisualization3DProps {
  currentStage: number
  stages: Stage[]
}

const CurvedLine: React.FC<{ progress: number }> = ({ progress }) => {
  const lineRef = useRef<THREE.BufferGeometry>(null)
  const materialRef = useRef<THREE.LineBasicMaterial>(null)
  const progressRef = useRef(0)

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-12, 0, 0),
      new THREE.Vector3(-6, 5, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(6, -5, 0),
      new THREE.Vector3(12, 0, 0)
    ])
  }, [])

  useEffect(() => {
    if (lineRef.current && materialRef.current) {
      const initialPositions = new Float32Array(1000 * 3)
      const initialColors = new Float32Array(1000 * 3)
      
      for (let i = 0; i < 1000; i++) {
        const t = i / 999
        const point = curve.getPoint(t)
        initialPositions[i * 3] = point.x
        initialPositions[i * 3 + 1] = point.y
        initialPositions[i * 3 + 2] = point.z

        const color = new THREE.Color().setHSL(t, 1, 0.5)
        initialColors[i * 3] = color.r
        initialColors[i * 3 + 1] = color.g
        initialColors[i * 3 + 2] = color.b
      }

      lineRef.current.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3))
      lineRef.current.setAttribute('color', new THREE.BufferAttribute(initialColors, 3))
      lineRef.current.setDrawRange(0, 2)
      materialRef.current.opacity = 0
    }
  }, [curve])

  useFrame(({ clock }) => {
    if (lineRef.current && materialRef.current) {
      const time = clock.getElapsedTime()
      const looptime = 10
      const t = (time % looptime) / looptime

      progressRef.current += (progress - progressRef.current) * 0.1
      const currentProgress = progressRef.current

      const positions = new Float32Array(1000 * 3)
      const colors = new Float32Array(1000 * 3)

      for (let i = 0; i < 1000; i++) {
        const t = i / 999
        const point = curve.getPoint(t)
        const wave = Math.sin(t * Math.PI * 20 + time * 2) * 0.7 * currentProgress
        positions[i * 3] = point.x
        positions[i * 3 + 1] = point.y + wave
        positions[i * 3 + 2] = point.z

        const hue = (t + time * 0.1) % 1
        const color = new THREE.Color().setHSL(hue, 1, 0.5)
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
      }

      lineRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      lineRef.current.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      const visiblePoints = Math.floor(currentProgress * 1000)
      lineRef.current.setDrawRange(0, Math.max(2, visiblePoints))

      materialRef.current.opacity = currentProgress
    }
  })

  return (
    <line>
      <bufferGeometry ref={lineRef} />
      <lineBasicMaterial ref={materialRef} vertexColors attach="material" linewidth={20} transparent />
    </line>
  )
}

const ReasoningVisualization3D: React.FC<ReasoningVisualization3DProps> = ({ currentStage, stages }) => {
  const safeStages = Array.isArray(stages) ? stages : []
  const totalStages = safeStages.length
  const progress = totalStages > 0 ? Math.max(0, Math.min(currentStage / totalStages, 1)) : 0

  const currentStageInfo = currentStage > 0 && currentStage <= totalStages ? safeStages[currentStage - 1] : null

  const stageTitle = currentStage === 0 ? "Preparing" : 
                     currentStageInfo ? currentStageInfo.title : 
                     (currentStage > totalStages ? "Process Complete" : "Process not started")
  const stageDescription = currentStage === 0 ? "Getting ready to start the reasoning process" :
                           currentStageInfo ? currentStageInfo.description : 
                           (currentStage > totalStages ? "All stages completed" : "Waiting to begin")

  return (
    <div className="w-full h-[40rem] bg-gray-900 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 20], fov: 75 }}>
        <color attach="background" args={['#111827']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <CurvedLine progress={progress} />
        <Text
          position={[0, 8, 0]}
          fontSize={1.6}
          color="#f59e0b"
          anchorX="center"
          anchorY="middle"
          maxWidth={20}
        >
          {stageTitle}
        </Text>
        <Text
          position={[0, -8, 0]}
          fontSize={0.8}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
          maxWidth={20}
          textAlign="center"
        >
          {stageDescription}
        </Text>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  )
}

export default ReasoningVisualization3D

