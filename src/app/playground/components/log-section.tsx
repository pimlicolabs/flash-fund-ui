"use client";

import { useState, useRef, useEffect } from "react";

interface LogEntry {
	timestamp: string;
	type: "request" | "response" | "info" | "error" | "success" | "debug";
	data: any;
}

export type AddLogFunction = (type: LogEntry["type"], data: any) => void;

function bigIntReplacer(_key: string, value: any): any {
	return typeof value === "bigint" ? value.toString() : value;
}

export default function LogSection() {
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const logsContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (logsContainerRef.current) {
			logsContainerRef.current.scrollTop =
				logsContainerRef.current.scrollHeight;
		}
	}, [logs]);

	const addLog = (type: LogEntry["type"], data: any) => {
		setLogs((prevLogs) => [
			...prevLogs,
			{
				timestamp: new Date().toISOString(),
				type,
				data,
			},
		]);
	};

	return {
		addLog,
		LogComponent: (
			<div className="w-1/3 border-r border-gray-200 flex flex-col h-full">
				<div className="bg-white border-b border-gray-200 p-4">
					<h2 className="text-lg font-bold">RPC Logs</h2>
					{logs.length === 0 && (
						<p className="text-gray-500 text-sm mt-2">
							No logs yet. Make a request to see the logs here.
						</p>
					)}
					{logs.length > 0 && (
						<button
							onClick={() => setLogs([])}
							className="text-sm text-red-500 hover:text-red-700"
						>
							Clear Logs
						</button>
					)}
				</div>
				<div
					ref={logsContainerRef}
					className="flex-1 overflow-auto p-4 bg-gray-50"
				>
					<div className="space-y-4">
						{logs.map((log, index) => (
							<div
								key={index}
								className={`p-3 rounded-lg ${
									log.type === "request"
										? "bg-purple-50 border border-purple-100"
										: log.type === "response"
											? "bg-green-50 border border-green-100"
											: log.type === "error"
												? "bg-red-50 border border-red-100"
												: log.type === "success"
													? "bg-blue-50 border border-blue-100"
													: log.type === "debug"
														? "bg-gray-50 border border-gray-100"
														: "bg-gray-50 border border-gray-100"
								}`}
							>
								<div className="flex justify-between items-start mb-2">
									<span
										className={`text-xs font-medium px-2 py-1 rounded ${
											log.type === "request"
												? "bg-purple-100 text-purple-700"
												: log.type === "response"
													? "bg-green-100 text-green-700"
													: log.type === "error"
														? "bg-red-100 text-red-700"
														: log.type === "success"
															? "bg-blue-100 text-blue-700"
															: "bg-gray-100 text-gray-700"
										}`}
									>
										{log.type.toUpperCase()}
									</span>
									<span className="text-xs text-gray-500">
										{new Date(log.timestamp).toLocaleTimeString()}
									</span>
								</div>
								<pre className="text-xs overflow-auto">
									{JSON.stringify(log.data, bigIntReplacer, 2)}
								</pre>
							</div>
						))}
					</div>
				</div>
			</div>
		),
	};
}
