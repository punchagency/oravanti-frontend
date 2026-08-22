import { usePermissionsMatrix } from "@/hooks/use-permissions-matrix";
import { Text } from "@chakra-ui/react";
import { PermissionsMatrixSkeleton } from "../../components/rbac-skeletons";
import { PermissionsMatrixView } from "../../components/permissions-matrix";

export default function RbacMatrixTab() {
  const matrixQuery = usePermissionsMatrix();

  if (matrixQuery.isLoading) {
    return <PermissionsMatrixSkeleton />;
  }

  return (
    <>
      <Text fontSize="12px" color="fg.muted" mb="12px" maxW="640px">
        Toggle access per role. Changes apply immediately to all staff
        holding that role.
      </Text>
      <PermissionsMatrixView matrix={matrixQuery.data} />
    </>
  );
}
