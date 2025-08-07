import { useState, Fragment } from 'react'; // Import Fragment
import { useNavigate } from 'react-router-dom';
import { Combobox, Transition } from '@headlessui/react'; // Import Combobox
import {
    DocumentArrowUpIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    MagnifyingGlassIcon,
    ExclamationTriangleIcon,
    ChevronUpDownIcon,
    CheckIcon
} from '@heroicons/react/24/outline';


function UploadCSV() {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState({ step: 'idle', message: '' }); // idle, uploading, success, error
    const [employeeNames, setEmployeeNames] = useState([]);
    const [selectedName, setSelectedName] = useState('');
    const [isPredicting, setIsPredicting] = useState(false);

    // ✅ REMOVED: filePaths state is no longer needed as backend handles data via MongoDB
    // const [filePaths, setFilePaths] = useState({ preprocessed: '', original: '' });

    // New state for the Combobox query
    const [query, setQuery] =useState('')

    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === "text/csv") {
            setFile(selectedFile);
            setStatus({ step: 'idle', message: '' });
        } else {
            setFile(null);
            setStatus({ step: 'error', message: 'Please select a valid .csv file.' });
        }
    };

    const handleReset = () => {
        setFile(null);
        setStatus({ step: 'idle', message: '' });
        setEmployeeNames([]);
        setSelectedName('');
        setQuery('');
        // ✅ REMOVED: Resetting filePaths as it's not used
        // setFilePaths({ preprocessed: '', original: '' });
    };

    const handleUpload = async () => {
        if (!file) {
            setStatus({ step: 'error', message: 'Please select a file first.' });
            return;
        }

        setStatus({ step: 'uploading', message: 'Uploading and processing file...' });
        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadResponse = await fetch('http://localhost:5000/upload', {
                method: 'POST',
                body: formData,
            });

            const uploadData = await uploadResponse.json();
            if (!uploadResponse.ok) {
                throw new Error(uploadData.error || 'File processing failed on the server.');
            }

            // ✅ MODIFIED: No longer destructuring preprocessed_path or original_filename
            // The backend /upload route now returns a simple message and redirect_url.
            // const { preprocessed_path, original_filename } = uploadData;
            // setFilePaths({ preprocessed: preprocessed_path, original: original_filename }); // This line is removed

            // ✅ MODIFIED: Fetch employee names directly from MongoDB via backend /api/employees (no query params needed)
            const namesResponse = await fetch(`http://localhost:5000/api/employees`);
            const namesData = await namesResponse.json();

            if (namesData.error) {
                throw new Error(namesData.error);
            }

            setEmployeeNames(namesData.names);
            // Pre-select the first employee for better UX, if available
            setSelectedName(namesData.names[0] || '');
            setStatus({ step: 'success', message: 'File processed. Please select an employee.' });

        } catch (err) {
            setStatus({ step: 'error', message: err.message });
        }
    };

    const handlePrediction = async () => {
        if (!selectedName) {
            setStatus({ step: 'error', message: 'Please select an employee to evaluate.' });
            return;
        }

        setIsPredicting(true);
        setStatus({ ...status, message: 'Generating predictions...' });
        const formData = new FormData();
        formData.append('employee_name', selectedName);

        try {
            // ✅ MODIFIED: Removed preprocessed_path and original_filename from the search URL
            // The backend /search route now directly queries MongoDB.
            const response = await fetch(
                `http://localhost:5000/search`,
                { method: 'POST', body: formData }
            );

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || 'Prediction request failed.');
            }

            const data = await response.json();
            localStorage.setItem('result_data', JSON.stringify(data));
            navigate('/generate-report', { state: { result_data: data } });

        } catch (err) {
            setStatus({ step: 'error', message: err.message });
        } finally {
            setIsPredicting(false);
        }
    };

    // Filtered names for the Combobox based on the query
    const filteredNames =
        query === ''
        ? employeeNames
        : employeeNames.filter((name) =>
            name.toLowerCase().replace(/\s+/g, '').includes(query.toLowerCase().replace(/\s+/g, ''))
        );

    // --- UI Render Helper Components ---
    const UploadInterface = () => (
        <div>
            <label
                htmlFor="file-upload"
                className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-indigo-500 transition-colors duration-200 ease-in-out cursor-pointer"
            >
                <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <span className="mt-2 block text-sm font-semibold text-gray-900">
                  {file ? file.name : 'Click to upload a file'}
                </span>
                {!file && (
                    <span className="mt-1 block text-xs text-gray-500">
                        or drag and drop CSV
                    </span>
                )}
            </label>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} />

            <div className="mt-6">
                <button
                    onClick={handleUpload}
                    disabled={!file}
                    className="w-full inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                    <DocumentArrowUpIcon className="-ml-1 mr-3 h-5 w-5" />
                    Upload and Process
                </button>
            </div>
        </div>
    );

    const LoadingInterface = ({ message }) => (
        <div className="flex flex-col items-center justify-center p-12 text-center">
            <ArrowPathIcon className="h-10 w-10 text-indigo-600 animate-spin" />
            <p className="mt-4 text-md font-semibold text-gray-800">{message}</p>
        </div>
    );

    const SearchInterface = () => (
        <div>
            <div className="rounded-md bg-green-50 p-4 mb-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">File Processed Successfully</h3>
                        <div className="mt-2 text-sm text-green-700">
                            <p>Select an employee from the list or type to search.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Start of Combobox (no changes here from previous update) --- */}
            <Combobox value={selectedName} onChange={setSelectedName}>
              <div className="relative mt-1">
                <Combobox.Label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</Combobox.Label>
                <div className="relative w-full cursor-default overflow-hidden rounded-md bg-white text-left shadow-sm border border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2">
                    <Combobox.Input
                        className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                        displayValue={(name) => name}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </Combobox.Button>
                </div>
                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                    afterLeave={() => setQuery('')}
                >
                    <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                    {filteredNames.length === 0 && query !== '' ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                            Nothing found.
                        </div>
                    ) : (
                        filteredNames.map((name) => (
                        <Combobox.Option
                            key={name}
                            className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                            }`
                            }
                            value={name}
                        >
                            {({ selected, active }) => (
                            <>
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {name}
                                </span>
                                {selected ? (
                                <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-indigo-600'}`}>
                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                                ) : null}
                            </>
                            )}
                        </Combobox.Option>
                        ))
                    )}
                    </Combobox.Options>
                </Transition>
              </div>
            </Combobox>
            {/* --- End of Combobox --- */}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={handleReset}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                    Upload New File
                </button>
                <button
                    onClick={handlePrediction}
                    disabled={!selectedName || isPredicting}
                    className="w-full inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300"
                >
                    {isPredicting ? (
                        <><ArrowPathIcon className="-ml-1 mr-2 h-5 w-5 animate-spin" />Evaluating...</>
                    ) : (
                        <><MagnifyingGlassIcon className="-ml-1 mr-2 h-5 w-5" />Get Predictions</>
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <div className="bg-gray-50/50 flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
            <div className="w-full max-w-lg">
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200/80">
                    {status.step === 'idle' && <UploadInterface />}
                    {status.step === 'uploading' && <LoadingInterface message={status.message} />}
                    {status.step === 'success' && <SearchInterface />}
                    {status.step === 'error' && (
                        <div className="text-center">
                            <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-red-500"/>
                            <p className="mt-4 font-semibold text-red-700">{status.message}</p>
                            <button
                                onClick={handleReset}
                                className="mt-6 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UploadCSV;