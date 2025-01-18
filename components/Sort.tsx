"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { sortTypes } from "@/constants";

const Sort = () => {
    const path = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentSort = searchParams.get("sort") || "$createdAt-desc";

    const handleSort = (value: string) => {
        console.log("Selected sort value:", value); // Debug
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", value); // Update sort in query params
        router.push(`${path}?${params.toString()}`); // Navigate with updated params
    };

    return (
        <Select onValueChange={handleSort} defaultValue={currentSort}>
            <SelectTrigger className="sort-select">
                <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="sort-select-content">
                {sortTypes.map((sort) => (
                    <SelectItem key={sort.value} value={sort.value}>
                        {sort.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default Sort;
