import { useState, useMemo } from "react";
import { formatUnits } from "viem";
import type { DCAOrder } from "../hooks/useShariaDCA";
import type { Token } from "../types";

interface DCAOrdersListProps {
	orders: DCAOrder[];
	tokens: Token[];
	isLoading: boolean;
	onCancelOrder: (orderId: bigint) => void;
}

export function DCAOrdersList({ orders, tokens, isLoading, onCancelOrder }: DCAOrdersListProps) {
	const [activeTab, setActiveTab] = useState<"all" | "open" | "history">("all");

	// Filter and sort orders based on active tab (newest first)
	const filteredOrders = useMemo(() => {
		return orders
			.filter((order) => {
				if (activeTab === "all") return true;
				if (activeTab === "open") return order.isActive;
				if (activeTab === "history") return !order.isActive;
				return true;
			})
			.sort((a, b) => {
				// Sort by startTime descending (newest first), fallback to id if startTime is same
				if (a.startTime !== b.startTime) {
					return Number(b.startTime - a.startTime);
				}
				return Number(b.id - a.id);
			});
	}, [orders, activeTab]);

	// Helper to find token by address
	const findTokenByAddress = (address: string) => {
		return tokens.find((t) => t.addresses.moonbase.toLowerCase() === address.toLowerCase());
	};

	// Helper to format interval
	const formatInterval = (seconds: bigint) => {
		const secs = Number(seconds);
		if (secs < 3600) return `${Math.floor(secs / 60)}m`;
		if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
		if (secs < 604800) return `${Math.floor(secs / 86400)}d`;
		return `${Math.floor(secs / 604800)}w`;
	};

	// Helper to get order status
	const getOrderStatus = (order: DCAOrder): "active" | "completed" | "cancelled" => {
		if (!order.isActive) {
			return order.intervalsCompleted >= order.totalIntervals ? "completed" : "cancelled";
		}
		return "active";
	};

	return (
		<div className="flex flex-col h-full">
			<h1 className="text-white tracking-light text-[32px] font-bold leading-tight text-center pb-6">
				Your orders
			</h1>

			<div className="bg-[#1a3a2f] rounded-xl border border-solid border-[#23483c] shadow-lg flex-1 flex flex-col">
				{/* Tabs */}
				<div className="flex gap-0 border-b border-[#23483c]">
					<button
						onClick={() => setActiveTab("all")}
						className={`flex-1 py-4 px-6 font-medium transition-colors ${
							activeTab === "all"
								? "text-white border-b-2 border-primary"
								: "text-white/60 hover:text-white/80"
						}`}
					>
						All
					</button>
					<button
						onClick={() => setActiveTab("open")}
						className={`flex-1 py-4 px-6 font-medium transition-colors ${
							activeTab === "open"
								? "text-white border-b-2 border-primary"
								: "text-white/60 hover:text-white/80"
						}`}
					>
						Open orders
					</button>
					<button
						onClick={() => setActiveTab("history")}
						className={`flex-1 py-4 px-6 font-medium transition-colors ${
							activeTab === "history"
								? "text-white border-b-2 border-primary"
								: "text-white/60 hover:text-white/80"
						}`}
					>
						Order history
					</button>
				</div>

				{/* Orders Table */}
				<div className="flex-1 overflow-auto">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center h-full py-16 px-4">
							<div className="text-primary text-2xl mb-2">Loading orders...</div>
						</div>
					) : filteredOrders.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full py-16 px-4">
							<div className="flex items-center justify-center mb-4 opacity-40">
								<svg
									width="120"
									height="120"
									viewBox="0 0 120 120"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									{/* Dinosaur icon - simple representation */}
									<path
										d="M40 80 L40 60 L50 50 L60 45 L70 50 L75 55 L80 60 L80 80 M60 45 L60 35 L65 30 L70 35 L70 45"
										stroke="currentColor"
										strokeWidth="4"
										fill="none"
										className="text-white/20"
									/>
									<circle cx="65" cy="37" r="2" fill="currentColor" className="text-white/20" />
									{/* Cup */}
									<path
										d="M85 65 L85 80 L95 80 L95 65 M90 65 L90 55 L85 55"
										stroke="currentColor"
										strokeWidth="3"
										fill="none"
										className="text-white/20"
									/>
								</svg>
							</div>
							<p className="text-white/40 text-xl font-medium mb-1">
								No recent activity
							</p>
							<p className="text-white/30 text-sm">
								Your DCA orders will appear here
							</p>
						</div>
					) : (
						<div className="hidden lg:block">
							<table className="w-full">
								<thead className="bg-[#23483c]/50 text-white/60 text-xs uppercase">
									<tr>
										<th className="text-left py-4 px-6 font-medium">
											PAY WITH / GET
										</th>
										<th className="text-left py-4 px-6 font-medium">
											INTERVAL
										</th>
										<th className="text-left py-4 px-6 font-medium">AMOUNT</th>
										<th className="text-left py-4 px-6 font-medium">PROGRESS</th>
										<th className="text-left py-4 px-6 font-medium">STATUS</th>
										{activeTab !== "history" && (
											<th className="text-left py-4 px-6 font-medium">ACTION</th>
										)}
									</tr>
								</thead>
								<tbody>
									{filteredOrders.map((order) => {
										const sourceToken = findTokenByAddress(order.sourceToken);
										const targetToken = findTokenByAddress(order.targetToken);
										const status = getOrderStatus(order);
										const intervalStr = formatInterval(order.interval);
										const amountStr = sourceToken 
											? formatUnits(order.amountPerInterval, sourceToken.decimals)
											: "0";

										return (
											<tr
												key={order.id.toString()}
												className="border-t border-[#23483c]/50 hover:bg-[#23483c]/20 transition-colors"
											>
												<td className="py-4 px-6 text-white font-medium">
													{sourceToken?.symbol || "?"} / {targetToken?.symbol || "?"}
												</td>
												<td className="py-4 px-6 text-white/70">
													Every {intervalStr}
												</td>
												<td className="py-4 px-6 text-white/70">
													{parseFloat(amountStr).toFixed(4)} {sourceToken?.symbol}
												</td>
												<td className="py-4 px-6 text-white/70">
													{order.intervalsCompleted.toString()} / {order.totalIntervals.toString()}
												</td>
												<td className="py-4 px-6">
													<span
														className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
															status === "active"
																? "bg-green-500/20 text-green-400"
																: status === "completed"
																? "bg-blue-500/20 text-blue-400"
																: "bg-red-500/20 text-red-400"
														}`}
													>
														{status.charAt(0).toUpperCase() + status.slice(1)}
													</span>
												</td>
												{activeTab !== "history" && (
													<td className="py-4 px-6">
														{order.isActive && (
															<button
																onClick={() => onCancelOrder(order.id)}
																className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-semibold transition-colors"
															>
																Cancel
															</button>
														)}
													</td>
												)}
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}

					{/* Mobile view for orders */}
					{!isLoading && filteredOrders.length > 0 && (
						<div className="lg:hidden p-4 space-y-3">
							{filteredOrders.map((order) => {
								const sourceToken = findTokenByAddress(order.sourceToken);
								const targetToken = findTokenByAddress(order.targetToken);
								const status = getOrderStatus(order);
								const intervalStr = formatInterval(order.interval);
								const amountStr = sourceToken 
									? formatUnits(order.amountPerInterval, sourceToken.decimals)
									: "0";

								return (
									<div
										key={order.id.toString()}
										className="bg-[#23483c] rounded-lg p-4 space-y-2"
									>
										<div className="flex justify-between items-start">
											<span className="text-white font-medium">
												{sourceToken?.symbol || "?"} / {targetToken?.symbol || "?"}
											</span>
											<span
												className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
													status === "active"
														? "bg-green-500/20 text-green-400"
														: status === "completed"
														? "bg-blue-500/20 text-blue-400"
														: "bg-red-500/20 text-red-400"
												}`}
											>
												{status.charAt(0).toUpperCase() + status.slice(1)}
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span className="text-white/60">Interval:</span>
											<span className="text-white/80">Every {intervalStr}</span>
										</div>
										<div className="flex justify-between text-sm">
											<span className="text-white/60">Amount:</span>
											<span className="text-white/80">
												{parseFloat(amountStr).toFixed(4)} {sourceToken?.symbol}
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span className="text-white/60">Progress:</span>
											<span className="text-white/80">
												{order.intervalsCompleted.toString()} / {order.totalIntervals.toString()}
											</span>
										</div>
										{order.isActive && (
											<button
												onClick={() => onCancelOrder(order.id)}
												className="w-full mt-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-semibold transition-colors"
											>
												Cancel Order
											</button>
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

