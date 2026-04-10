"use client"

import { useState, useEffect, useCallback } from "react"

interface GPSCoordinates {
  lat: number
  lng: number
  accuracy: number
  timestamp: string
}

interface GPSState {
  status: "idle" | "loading" | "verified" | "error"
  coordinates: GPSCoordinates | null
  error: string | null
}

export function useGPS() {
  const [state, setState] = useState<GPSState>({
    status: "idle",
    coordinates: null,
    error: null,
  })

  const captureLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        status: "error",
        coordinates: null,
        error: "Geolocalización no soportada en este dispositivo",
      })
      return
    }

    setState((prev) => ({ ...prev, status: "loading", error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: GPSCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        }
        setState({
          status: "verified",
          coordinates: coords,
          error: null,
        })
      },
      (error) => {
        let errorMessage = "Error al obtener ubicación"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permiso de ubicación denegado"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Ubicación no disponible"
            break
          case error.TIMEOUT:
            errorMessage = "Tiempo de espera agotado"
            break
        }
        setState({
          status: "error",
          coordinates: null,
          error: errorMessage,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }, [])

  // Auto-capture on mount
  useEffect(() => {
    captureLocation()
  }, [captureLocation])

  // Function to prepare data for Firebase upload
  const getFirebaseLocationData = useCallback(
    (userId: string, sessionId: string) => {
      if (!state.coordinates) return null
      return {
        userId,
        sessionId,
        lat: state.coordinates.lat,
        lng: state.coordinates.lng,
        accuracy: state.coordinates.accuracy,
        timestamp: state.coordinates.timestamp,
      }
    },
    [state.coordinates]
  )

  return {
    ...state,
    captureLocation,
    getFirebaseLocationData,
  }
}
