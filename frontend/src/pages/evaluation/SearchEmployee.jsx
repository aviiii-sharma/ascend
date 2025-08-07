import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

function SearchEmployee() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const preprocessedPath = searchParams.get('preprocessed_path')
  const originalFilename = searchParams.get('original_filename')

  const [names, setNames] = useState([])
  const [selectedName, setSelectedName] = useState('')
  const [status, setStatus] = useState('')
  const [loadingNames, setLoadingNames] = useState(true)
  const [loadingPrediction, setLoadingPrediction] = useState(false)

  // ✅ Fetch employee names from backend
  useEffect(() => {
    const fetchNames = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/employees?preprocessed_path=${encodeURIComponent(preprocessedPath)}`
        )
        const data = await response.json()

        if (data.error) {
          setStatus('❌ ' + data.error)
        } else {
          setNames(data.names)
        }
      } catch (err) {
        setStatus('❌ Failed to load employee list')
      } finally {
        setLoadingNames(false)
      }
    }

    if (preprocessedPath) fetchNames()
  }, [preprocessedPath])

  // ✅ Handle prediction + navigation
  const handleSubmit = async () => {
    if (!selectedName) {
      setStatus('❌ Please select a name')
      return
    }

    setLoadingPrediction(true)
    setStatus('')

    try {
      const formData = new FormData()
      formData.append('employee_name', selectedName)

      const response = await fetch(
        `http://localhost:5000/search?preprocessed_path=${encodeURIComponent(preprocessedPath)}&original_filename=${encodeURIComponent(originalFilename)}`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        const err = await response.text()
        setStatus('❌ ' + err)
        return
      }

      const data = await response.json()
      console.log('[✅ Prediction Result]', data)

      // ✅ Store in localStorage as backup (for refresh-safe access)
      localStorage.setItem('result_data', JSON.stringify(data))

      // ✅ Navigate with router state
      navigate('/generate-report', {
        state: { result_data: data },
      })

    } catch (err) {
      setStatus('❌ Prediction error: ' + err.message)
    } finally {
      setLoadingPrediction(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded mt-10">
      <h2 className="text-2xl font-bold mb-4">🔍 Search Employee</h2>

      {loadingNames ? (
        <p className="text-gray-500">Loading employee list...</p>
      ) : (
        <>
          <select
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          >
            <option value="">-- Select an Employee --</option>
            {names.map((name, index) => (
              <option key={index} value={name}>
                {name}
              </option>
            ))}
          </select>

          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={loadingPrediction}
          >
            {loadingPrediction ? 'Evaluating...' : 'Get Predictions'}
          </button>
        </>
      )}

      {status && <p className="mt-4 text-red-600">{status}</p>}
    </div>
  )
}

export default SearchEmployee
